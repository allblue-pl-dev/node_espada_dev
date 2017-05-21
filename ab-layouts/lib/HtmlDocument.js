'use strict';

var xmldoc = require('xmldoc');


var HtmlDocument = {
    self: null,

    _nodes: null,

    Class: function(html)
    {
        var self = this.self = this;

        /* Find replace text with `<html-document-text` nodes. */
        //var regexp = new RegExp(/>([ \t\r\n]*)(.*?)([ \t\r\n]*)</gs);

        /* Text to nodes. */
        /* Comments to text nodes. */
        var regexp = /<!--([\s\S]*?)-->/gm;
        while(true) {
            var match = regexp.exec(html);
            if (!match)
                break;

            var escaped = match[1]
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

            html = html.replace(match[0], '<html-document-comment>' +
                    escaped + '</html-document-comment>');
        }

        /* Replace text with text nodes. */
        html = html.replace(/(>|^)([ \t\r\n]*)([\s\S]*?)([ \t\r\n]*)(<|$)/g,
                '$1$2<html-document-text>$3</html-document-text>$4$5');

        html = html.replace(
                /<html-document-text><\/html-document-text>/mg, '');

        html = '<html-document>' + html + '</html-document>';

        var xmldoc_document = new xmldoc.XmlDocument(html);

        self._parse(xmldoc_document);
    },

    getNodes: function()
    {
        var self = this.self;

        return self._nodes;
    },

    _parse: function(xmldoc_document)
    {
        var self = this.self;

        self._nodes = [];
        self._parse_ParseNodeChildren(null, xmldoc_document);
    },

    _parse_ParseNodeChildren: function(parent_node, xmldoc_child)
    {
        var self = this.self;

        for (var i = 0; i < xmldoc_child.children.length; i++)
            self._parse_ParseNode(parent_node, xmldoc_child.children[i]);
    },

    _parse_ParseNode: function(parent_node, xmldoc_child)
    {
        var self = this.self;

        var node = {};

        if (parent_node === null)
            self._nodes.push(node);
        else
            parent_node.children.push(node);

        if (xmldoc_child.name === 'html-document-text') {
            node.type = 'text';
            node.value = xmldoc_child.val;
        } else if (xmldoc_child.name === 'html-document-comment') {
            node.type = 'comment';
            node.value = xmldoc_child.val;
        } else {
            node.type = 'element';

            node.name = xmldoc_child.name;

            node.attribs = {};
            for (var name in xmldoc_child.attr)
                node.attribs[name] = xmldoc_child.attr[name];

            node.children = [];

            self._parse_ParseNodeChildren(node, xmldoc_child);
        }
    }

};
HtmlDocument.Class.prototype = HtmlDocument;
module.exports = HtmlDocument;
