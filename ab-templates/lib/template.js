'use strict';

var fs = require('fs');
var path = require('path');

var abFiles = require('ab-files');
var abPathQuery = require('ab-path-query');
var abLog = require('ab-log');
var abTypes = require('ab-types');
var abRecall = require('ab-recall');
var abSync = require('ab-sync');
var jsonlint = require('jsonlint');
var less = require('less');


var Template = {
    self: null,

    CoreExtNames: {
        'css': 'CssExt',
        'js': 'JSExt',
        'less': 'LessExt'
    },


    _final: false,

    _versionHash: '',

    _templatePath: '',
    _templateDirPath: '',

    _templateInfos: null,

    _templatePathQueries: null,

    _exts: [],

    _header: '',

    _recalls_Build: null,
    _recalls_Build_Ext: null,
    _recalls_Build_Header: null,

    _watching: false,

    _backPath: './build',
    _frontPath: './',
    _indexPath: './',
    _indexUri: '{{base}}',

    Class: function(template_path, final)
    {
        var self = this.self = this;

        self._final = typeof final === 'undefined' ? false : final;

        self._generateVersionHash();

        self._templatePath = template_path;

        if (!abFiles.file_Exists(self._templatePath)) {
            throw new Error('Template path `' + self._templatePath +
                    '` does not exist.');
        }

        self._templateDirPath = path.dirname(self._templatePath);

        self._exts = [];

        /* Recalls */
        self._initializeRecalls();
    },

    addHeaderTag: function(name, attribs)
    {
        var self = this.self;

        self._header += self._getTag(name, attribs);
    },

    build: function()
    {
        var self = this.self;

        self._recalls_Build.call();
    },

    build_Exts: function()
    {
        var self = this.self;

        self._recalls_Build_Exts.call();
    },

    build_Header: function()
    {
        var self = this.self;

        self._recalls_Build_Header.call();
    },

    ext: function(name, args)
    {
        var self = this.self;

        args = typeof args === 'undefined' ? {} : args;

        var external = true;
        try {
            require.resolve('ab-templates_' + name);
        } catch (err) {
            external = false;
        }

        var ext = null;

        if (external)
            ext = require('ab-templates_' + name).new(self, args);
        else {
            if (!(name in Template.CoreExtNames))
                throw new Error('Ext `' + name + '` does not exist');

            var ext_require = './exts/' + Template.CoreExtNames[name];
            var ext_class = require(ext_require);
            ext = new ext_class.Class(self, args);
        }

        self._exts.push(ext);


        return self;
    },

    getPath_Front: function()
    {
        var self = this.self;

        return self._frontPath;
    },

    getPath_Index: function()
    {
        var self = this.self;

        return self._indexPath;
    },

    getPathUri: function(fs_path)
    {
        var self = this.self;

        var relative_file_path = self.getRelativePath(fs_path);
        return self._indexUri + relative_file_path.replace(/\\/g, '/');
    },

    getRelativePath: function(fs_path)
    {
        var self = this.self;

        return path.relative(self._indexPath, fs_path);
    },

    getRelativeUri: function(fs_path, base_path)
    {
        var self = this.self;

        return path.relative(fs_path, base_path)
            .replace(/\\/gm, '/');
    },

    getTemplateDirPath: function()
    {
        var self = this.self;

        return self._templateDirPath;
    },

    getTemplateInfos: function()
    {
        var self = this.self;

        return self._templateInfos;
    },

    getUri_Index: function()
    {
        var self = this.self;

        return self._indexUri;
    },

    getVersionHash: function()
    {
        return this._versionHash;
    },

    isWatching: function()
    {
        var self = this.self;

        return self._watching;
    },

    parse: function()
    {
        var self = this.self;

        abLog.log('Parsing...');

        self._clear();
        self._parse_ParseMainTemplateInfo();
        self._parse_ParseTemplateExts();

        abLog.success('Finished.');
    },

    unwatch: function()
    {
        var self = this.self;

        for (var i = 0; i < self._templatePathQueries.length; i++)
            self._templatePathQueries[i].unwatch();

        for (var i = 0; i < self._exts.length; i++)
            self._exts[i].unwatch();

        self._watching = false;
    },

    watch: function()
    {
        var self = this.self;

        for (var i = 0; i < self._templatePathQueries.length; i++)
            self._templatePathQueries[i].watch();

        for (var i = 0; i < self._exts.length; i++)
            self._exts[i].watch();

        self._watching = true;
    },

    _build_Init: function()
    {
        var self = this.self;

        if (!abFiles.dir_Exists(self._buildDirPath)) {
            abLog.warn('`build_path` does not exist. Creating...');
            abFiles.dir_Create(self._buildDirPath);
        }
    },

    _build_Sync: function()
    {
        var self = this.self;

        self._recalls_Build.call.apply(self._recalls_Build, arguments);
    },

    _clear: function()
    {
        var self = this.self;

        self._templateInfos = [];
        self._templatePathQueries = [];

        self._header = '';
    },

    _generateVersionHash: function()
    {
        this._versionHash = '';

        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
                'abcdefghijklmnopqrstuvwxyz' + '0123456789';

        for (var i=0; i < 10; i++) {
            this._versionHash +=
                    chars.charAt(Math.floor(Math.random() * chars.length));
        }
    },

    _getJSONFromFile: function(json_path)
    {
        var self = this.self;

        var json = null;

        var json_string = abFiles.file_GetContent(json_path);
        if (json_string === null) {
            abLog.error('Cannot find `%s`.', json_path);
            return null;
        }

        try {
            json = JSON.parse(json_string);
        } catch (err) {
            abLog.error('Cannot parse `%s`:', json_path);
            try {
                jsonlint.parse(json_string);
            } catch (err) {
                abLog.warn(err);
            }
        }

        return json;
    },

    _getTag: function(name, attribs, self_closing)
    {
        var self = this.self;

        self_closing = typeof self_closing === 'undefined' ? false : true;

        var html = '<' + name;
        for (var attrib_name in attribs)
            html += ' ' + attrib_name + '="' + attribs[attrib_name] + '"';

        if (self_closing)
            html += ' />';
        else
            html += '></' + name + '>' + "\r\n";

        return html;
    },

    _initializeRecalls: function()
    {
        var self = this.self;

        self._recalls_Build = abRecall.new(function(sync) {
            sync.join(function(sync) {
                self._recalls_Build_Exts.call(sync);
            }, 'recalls_Build_Exts');

            sync.join(function(sync) {
                self._recalls_Build_Header.call(sync);
            }, 'recalls_Build_Header');

            return sync.finished();
        }, 'recalls_Build');

        self._recalls_Build_Exts = abRecall.new(function(sync, args) {
            var fns = [];

            self._exts.forEach(function(ext) {
                sync.async(function(sync) {
                    sync.join(function(sync) {
                        ext.build_Sync(sync);
                    }, 'ext_Build');

                    return sync.finished();
                }, 'ext_' + ext.getName());
            });

            sync.join(function(sync) {
                for (var i = 0; i < args.length; i++)
                    if (args[i].length > 0)
                        args[i][0].finished();

                sync.finished();
            }, 'finish');

            return sync.finished();
        }, 'recalls_Build_Exts');

        self._recalls_Build_Header = abRecall.new(function(sync, args) {
            if (!abFiles.dir_Exists(self._backPath)) {
                abLog.warn('`%s` does not exist. Creating...', self._backPath);
                abFiles.dir_Create(self._backPath);
            }

            abFiles.file_PutContent(
                    path.join(self._backPath, 'header.html'),
                    self._header);

            abLog.success('Built `header.html`.');

            for (var i = 0; i < args.length; i++)
                if (args[i].length > 0)
                    args[i][0].finished();

            return sync.finished();
        }, 'recalls_Build_Header');
    },

    _logStack: function(stack)
    {
        var self = this.self;

        for (var i = 0; i < stack.length; i++)
            abLog.warn(' - %s', stack[i]);
    },

    _mergeObjects: function(template_info_to, template_info_from)
    {
        var self = this.self;

        for (var key in template_info_from) {
            var from_val = template_info_from[key];

            if (abTypes.isObject(from_val)) {
                if (!(key in template_info_to))
                    template_info_to[key] = {};
                else if (!abTypes.isObject(template_info_to[key]))
                    template_info_to[key] = {};

                self._mergeObjects(template_info_to[key],
                        from_val);
            } else if (abTypes.isArray(from_val))
                template_info_to[key] = from_val.slice(0);
            else
                template_info_to[key] = from_val;
        }
    },

    _parse_ParseMainTemplateInfo: function()
    {
        var self = this.self;

        var template_info = self._getJSONFromFile(self._templatePath);
        if (template_info === null)
            return;

        var fp = abPathQuery.new(self._templatePath);

        fp.onChange(function() {
            self.parse();
            self.build();
        });

        if ('backPath' in template_info)
            self._backPath = template_info.backPath;
        if ('frontPath' in template_info)
            self._frontPath = template_info.frontPath;
        if ('indexPath' in template_info)
            self._indexPath = template_info.indexPath;
        if ('indexUri' in template_info)
            self._indexUri = template_info.indexUri;

        self._templatePathQueries.push(fp);
        self._templateInfos.push({
            info: template_info,
            path: path.dirname(self._templatePath)
        });

        self._parse_ParseTemplatesPaths(template_info);
        //self._parse_ParseTemplateInfo([self._templatePath], template_info);
    },

    _parse_ParseTemplatesPaths: function(template_info)
    {
        var self = this.self;

        if (!('templates' in template_info))
            return;

        var templates_paths = template_info.templates;
        templates_paths.forEach(function(templates_path) {
            var files_path = new abPathQuery.new(templates_path);

            files_path.onChange(function() {
                self.parse();
                self.build();
            });

            self._templatePathQueries = self._templatePathQueries.splice(0, 1,
                    files_path);

            var template_paths = [];

            var fp_paths = files_path.getPaths();
            for (var j = 0; j < fp_paths.length; j++) {
                if (abFiles.file_Exists(fp_paths[j])) {
                    fp_paths.push(fp_paths[j]);
                    continue;
                }

                var template_file_path = path.join(fp_paths[j],
                        'ab-template.js');
                if (abFiles.file_Exists(template_file_path))
                    template_paths.push(template_file_path);
            }

            for (var j = 0; j < template_paths.length; j++) {
                var template_path = null;

                if (abFiles.file_Exists(template_paths[j]))
                    template_path = template_paths[j];
                else {
                    var t_template_path = path.join(template_paths[j],
                            'ab-template.json');

                    if (abFiles.file_Exists(t_template_path))
                        template_path = t_template_path;
                }

                if (template_path === null)
                    continue;

                var template_info = self._getJSONFromFile(template_path);
                if (template_info === null)
                    continue;

                self._parse_ParseTemplatesPaths_AddTemplateInfo(template_path);
                self._parse_ParseTemplatesPaths(template_info);
            }
        });
    },

    _parse_ParseTemplatesPaths_AddTemplateInfo: function(template_path)
    {
        var template_info = self._getJSONFromFile(template_path);

        var template_path = path.dirname(template_path);
        for (var j = 0; j < self._exts.length; j++) {
            self._templateInfos.push({
                inf: template_info,
                path: template_path
            });
        }
    },

    _parse_ParseTemplateExts: function()
    {
        var self = this.self;

        for (var i = 0; i < self._exts.length; i++)
            self._exts[i].parse();
    }

};
Template.Class.prototype = Template;
module.exports = Template;
