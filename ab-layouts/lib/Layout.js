'use strict';

var path = require('path');

var abFiles = require('ab-files');
var abLog = require('ab-log');

var HtmlDocument = require('./HtmlDocument');


var Layout = {
    self: null,

    FnType_Var: 0,
    FnType_Field: 1,

    Build: function(layout_path, build_path, debug)
    {
        if (!abFiles.file_Exists(layout_path)) {
            abLog.error('Layout file path `%s` does not exist.', layout_path);

            return false;
        }

        var l;

        try {
            l = new Layout.Class(abFiles.file_GetContent(layout_path), debug);
        } catch (err) {
            abLog.error('Cannot parse layout `%s`.', layout_path);
            abLog.warn(err.stack);

            return false;
        }

        var file_name = path.basename(layout_path, '.html');
        var layout_build_path = path.join(build_path, file_name + '.json');

        return abFiles.file_PutContent(layout_build_path,
                JSON.stringify(l.getJSON(), null, 4));
    },

    ParseFile: function(file_path)
    {
        if (!abFiles.file_Exists(file_path)) {
            abLog.error('Layout path `%s` does not exist.', file_path);
            return;
        }

        var layout_html = abFiles.file_GetContent(file_path);

        return new Layout.Class(layout_html);
    },


    _debug: false,
    _json: null,

    _nodeRepeatInfos: null,

    Class: function(layout_html, debug)
    {
        var self = this.self = this;

        if (typeof debug !== 'undefined')
            self._debug = debug;

        self._json = {
            elems: {},
            fields: {},
            fieldFns: {},
            holders: {},
            nodes: []
        };

        self._nodeRepeatInfos = {};
        var layout_document = new HtmlDocument.Class(layout_html);
        self._parse(layout_document);
    },

    getJSON: function()
    {
        var self = this.self;

        return self._json;
    },

    _json_AddNodeChild: function(parent_node_index, child_node_index)
    {
        var self = this.self;

        var parent_node = self._json.nodes[parent_node_index];

        if (!('children' in parent_node))
            parent_node.children = [];

        self._json.nodes[parent_node_index].children.push(child_node_index);
    },

    _getElemJSON: function(elem_name, node_json_index)
    {
        var self = this.self;

        var fn_info = self._getFnInfo(elem_name, node_json_index);

        if (!fn_info.isFn)
            return [elem_name];

        var args = [];
        for (var i = 0; i < fn_info.args.length; i++) {
            var arg_info = fn_info.args[i];

            if (arg_info[0] !== 1)
                throw new Error('Element can have only fields as arguments.');

            args.push(arg_info[1]);
        }

        return [fn_info.name, args];
    },

    _getFieldInfo: function(field_name, node_json_index)
    {
        var self = this.self;

        var info = [];

        var fn_info = self._getFnInfo(field_name, node_json_index);

        if (fn_info.isFn)
            field_name = fn_info.name;

        var repeat_infos = self._nodeRepeatInfos[node_json_index];
        for (var i = repeat_infos.length - 1; i >= 0; i--) {
            var item = repeat_infos[i].item;
            var item_field = repeat_infos[i].field;
            var key = repeat_infos[i].key;

            if (field_name === key)
                field_name = item_field + '.#';
            else {
                field_name = field_name.replace(new RegExp('^' + item),
                        item_field + '.*');
            }
        }

        if (!fn_info.isFn) {
            info.push(field_name);
        } else {
            info.push(field_name);
            info.push(fn_info.args);
        }

        if (!(field_name in self._json.fields)) {
            self._json.fields[field_name] = {
                virtual: repeat_infos.length === 0 ? false : true
            };
        }

        return {
            name: field_name,
            json: self._json.fields[field_name],
            info: info
        };
    },

    _getFnInfo: function(name, node_json_index)
    {
        var self = this.self;

        var match = /([a-zA-Z0-9_\$\.]+?)\((.*?)\)/gm.exec(name);

        if (!match) {
            return {
                isFn: false,
                name: name
            };
        }

        name = match[1];

        var args = self._getFnInfo_GetArgs(match[2], node_json_index);

        // var args = match[2].replace(' ', '').split(',');
        // if (args.length === 1 && args[0] === '')
        //     args = [];

        return {
            isFn: true,
            name: name,
            args: args
        }
    },

    _getFnInfo_GetArgs: function(args, node_json_index)
    {
        var self = this.self;

        var arg_infos = [];

        var regexp = /('(.+?)')|([0-9\.]+)|([a-zA-Z_]+)/g;
        while (true) {
            var match = regexp.exec(args);
            if (!match)
                break;

            if (typeof match[1] !== 'undefined') {
                arg_infos.push([
                    Layout.FnType_Var,
                    match[2]
                ]);
            } else if (typeof match[3] !== 'undefined') {
                arg_infos.push([
                    Layout.FnType_Var,
                    Number(match[3])
                ]);
            } else if (typeof match[4] !== 'undefined') {
                var field_info = self._getFieldInfo(match[4], node_json_index);

                arg_infos.push([
                    Layout.FnType_Field,
                    field_info.info
                ]);
            }
        }

        return arg_infos;
    },

    _getTextFields: function(text, node_json_index)
    {
        var self = this.self;

        var fields = [];

        var start_index = text.indexOf('{{');
        var end_index = text.lastIndexOf('}}');

        if (start_index === -1 && end_index === -1)
            return [[0, text]];

        if (start_index !== -1 && start_index !== 0)
            fields.push([0, text.substring(0, start_index)])

        var fields_regexp = /{{([\s\S]+?)}}/g;
        var texts_regexp = /}}([\s\S]*?){{/g;

        var possible_text_match = true;
        while (true) {
            var field_match = fields_regexp.exec(text);
            if (!field_match)
                break;

            var field_info = self._getFieldInfo(field_match[1],
                        node_json_index);
            fields.push([1, field_info.info]);

            var text_match = texts_regexp.exec(text);
            if (!text_match)
                continue;

            if (text_match[1] === '')
                continue;

            fields.push([0, text_match[1]]);
        }

        if (end_index !== -1 && end_index !== text.length - 2)
            fields.push([0, text.substring(end_index + 2)]);

        return fields;
    },

    _parse: function(layout_document)
    {
        var self = this.self;

        self._nodeRepeatInfos[-1] = [];
        self._parseNodes(-1, layout_document.getNodes());
    },

    _parseNodes: function(parent_node_index, nodes)
    {
        var self = this.self;

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].type === 'text') {
                self._parseNodes_ParseTextNode(parent_node_index, nodes[i],
                        false);
            } else if (nodes[i].type === 'comment') {
                self._parseNodes_ParseTextNode(parent_node_index, nodes[i],
                    true);
            } else if (nodes[i].type === 'element') {
                self._parseNodes_ParseElementNode(parent_node_index, nodes[i]);

                self._parseNodes(self._json.nodes.length - 1,
                        nodes[i].children);
            }
        }
    },

    _parseNodes_ParseTextNode: function(parent_node_index, node, is_comment) {
        var self = this.self;

        var text = node.value;
        //var regexp = /{{([a-zA-Z\.]+)}}/g;

        var start_index = text.indexOf('{{');
        var end_index = text.lastIndexOf('}}');

        if (start_index === -1 && end_index === -1) {
            self._parseNodes_ParseTextNode_AddNode(parent_node_index,
                    false, text);
            return;
        }

        if (start_index !== -1 && start_index !== 0) {
            self._parseNodes_ParseTextNode_AddNode(parent_node_index,
                    false, text.substring(0, start_index));
        }

        var fields_regexp = /{{([\s\S]+?)}}/g;
        var texts_regexp = /}}([\s\S]*?){{/g;

        var possible_text_match = true;
        while (true) {
            var field_match = fields_regexp.exec(text);
            if (!field_match)
                break;

            self._parseNodes_ParseTextNode_AddNode(parent_node_index,
                    true, field_match[1]);

            var text_match = texts_regexp.exec(text);
            if (!text_match)
                continue;

            if (text_match[1] === '')
                continue;

            self._parseNodes_ParseTextNode_AddNode(parent_node_index,
                    false, text_match[1]);
        }

        if (end_index !== -1 && end_index !== text.length - 2) {
            self._parseNodes_ParseTextNode_AddNode(parent_node_index,
                    false, text.substring(end_index + 2));
        }
    },

    _parseNodes_ParseTextNode_AddNode: function(parent_node_index, has_field,
            text, is_comment)
    {
        var self = this.self;

        var node_json = {
            parent: parent_node_index,
            type: is_comment ? '_comment' : '_text'
        };

        self._json.nodes.push(node_json);
        var node_json_index = self._json.nodes.length - 1;

        if (parent_node_index >= 0)
            self._json_AddNodeChild(parent_node_index, node_json_index);

        /* Repeats */
        self._nodeRepeatInfos[node_json_index] =
                self._nodeRepeatInfos[parent_node_index].slice();

        /* Parse Node Fields */
        if (has_field) {
            var field_name = text;
            var field = self._getFieldInfo(field_name, node_json_index);

            node_json.field = field.info;

            if (!('nodes' in field.json))
                field.json.nodes = [];
            field.json.nodes.push(node_json_index);
        } else {
            node_json.val = text;
        }
    },

    _parseNodes_ParseElementNode: function(parent_node_index, node) {
        var self = this.self;

        var node_json = {
            parent: parent_node_index,
            type: node.name,
        };

        self._json.nodes.push(node_json);
        var node_json_index = self._json.nodes.length - 1;

        if (parent_node_index >= 0)
            self._json_AddNodeChild(parent_node_index, node_json_index);

        /* Parse Repeats */
        self._nodeRepeatInfos[node_json_index] =
                self._nodeRepeatInfos[parent_node_index].slice();

        if ('ab-repeat' in node.attribs) {
            var repeat_array = node.attribs['ab-repeat'].split(':');
            if (self._debug)
                delete node.attribs['ab-repeat'];

            var field_name = repeat_array[0];

            var item = '_item';
            if (repeat_array.length >= 1);
                item = repeat_array[1];

            var key = '_key';
            if (repeat_array.length >= 2)
                key = repeat_array[2];

            var field = self._getFieldInfo(field_name, node_json_index);

            self._nodeRepeatInfos[node_json_index].push({
                field: field.name,
                item: item,
                key: key
            });

            node_json.repeat = field.info;

            if (!('repeats' in field.json))
                field.json.repeats = [];
            field.json.repeats.push(node_json_index);
        }

        /* Parse Elems */
        if ('ab-elem' in node.attribs) {
            var elem_id = node.attribs['ab-elem'];
            if (self._debug)
                delete node.attribs['ab-elem'];

            if (elem_id in self._json.elems)
                abLog.warn('Duplicated elem `%s`.', elem_id);

            node_json.elem = self._getElemJSON(elem_id, node_json_index);
            self._json.elems[elem_id] = node_json_index;
        }

        /* Parse Show */
        if ('ab-show' in node.attribs) {
            var field_name = node.attribs['ab-show'];
            if (self._debug)
                delete node.attribs['ab-show'];

            var field = self._getFieldInfo(field_name, node_json_index);

            node_json.show = field.info;

            if (!('shows' in field.json))
                field.json.shows = [];
            field.json.shows.push(node_json_index);
        }

        /* Parse Hide */
        if ('ab-hide' in node.attribs) {
            var field_name = node.attribs['ab-hide'];
            if (self._debug)
                delete node.attribs['ab-hide'];

            var field = self._getFieldInfo(field_name, node_json_index);

            node_json.hide = field.info;

            if (!('hides' in field.json))
                field.json.hides = [];
            field.json.hides.push(node_json_index);
        }

        /* Parse Holders */
        if ('ab-holder' in node.attribs) {
            var holder_name = node.attribs['ab-holder'];
            if (self._debug)
                delete node.attribs['ab-holder'];

            if (!(holder_name in self._json.holders))
                self._json.holders[holder_name] = [];
            self._json.holders[holder_name].push(node_json_index);

            node_json.holder = holder_name;
        }

        /* Parse Node Fields */
        if ('ab-field' in node.attribs) {
            var field_name = node.attribs['ab-field'];
            if (self._debug)
                delete node.attribs['ab-field'];

            var field = self._getFieldInfo(field_name, node_json_index);

            node_json.field = field.info;

            if (!('nodes' in field.json))
                field.json.nodes = [];
            field.json.nodes.push(node_json_index);
        }

        /* Parse Attrib Fields */
        // var prefix = 'ab-attr-';
        // for (var attrib_name in node.attribs) {
        //     if (attrib_name.indexOf(prefix) === -1)
        //         continue;
        //
        //     var field_name = node.attribs[attrib_name];
        //     if (self._debug)
        //         delete node.attribs[attrib_name];
        //
        //     var attrib_field_name = attrib_name.substring(prefix.length);
        //
        //     var field = self._getFieldInfo(field_name, node_json_index);
        //
        //     if (!('fieldAttrs' in node_json))
        //         node_json.fieldAttrs = {};
        //     node_json.fieldAttrs[attrib_field_name] = field.info;
        //
        //     if (!('attrs' in field.json))
        //         field.json.attrs = [];
        //     field.json.attrs.push(
        //             [node_json_index, attrib_field_name]);
        // }

        /* Parse Attribs */
        if (Object.keys(node.attribs).length > 0) {
            for (var attrib_name in node.attribs) {
                var attr_infos = self._getTextFields(node.attribs[attrib_name],
                        node_json_index);

                if (attr_infos.length === 1 && attr_infos[0][0] === 0) {
                    if (!('attrs' in node_json))
                        node_json.attrs = {};

                    node_json.attrs[attrib_name] = attr_infos[0][1];
                } else {
                    if (!('fieldAttrs' in node_json))
                        node_json.fieldAttrs = {};

                    node_json.fieldAttrs[attrib_name] = attr_infos;

                    if (self._debug) {
                        if (!('attrs' in node_json))
                            node_json.attrs = {};

                        node_json.attrs['ab-attr-' + attrib_name] =
                                node.attribs[attrib_name];
                    }
                }
            }
        }
    }

}
Layout.Class.prototype = Layout;
module.exports = Layout;
