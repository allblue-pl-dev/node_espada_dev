'use strict';

var path = require('path');

var abFiles = require('ab-files');
var abLog = require('ab-log');

var ABLayouts = require('ab-layouts').Lib;


var Layouts = {
    self: null,

    _basePath: './',
    _baseUri: '/',

    _layouts: null,

    Class: function(base_path, base_uri)
    {
        var self = this.self = this;

        if (typeof base_path !== 'undefined')
            self._basePath = base_path;

        if (typeof base_uri !== 'undefined')
            self._baseUri = base_uri;

        self._layouts = {};
    },

    add: function(layout_name, layout_path)
    {
        var self = this.self;

        if (layout_name in self._layouts) {
            abLog.warn('Layout `%s` already exists. Overwriting.',
                    layout_name);
        }

        var ext = '.html';

        var layout_uri = self._getPathUri(layout_path);
        layout_uri = layout_uri.substring(0, layout_path.length -
                ext.length - 2) + '.json';

        self._layouts[layout_name] = {
            path: layout_path,
            uri: layout_uri
        };
    },

    build: function(build_path)
    {
        var self = this.self;

        if (!abFiles.dir_Exists(build_path)) {
            abLog.warn('Build path `%s` does not exist. Creating...',
                    build_path);
            abFiles.dir_Create(build_path);
        }

        var layouts_build_path = path.join(build_path, 'layouts');

        self._build_Layouts(layouts_build_path);
        self._build_LayoutsInfo(build_path, layouts_build_path);

        return true;
    },

    getLayouts: function()
    {
        var self = this.self;

        return self._layouts;
    },

    _build_Layouts: function(layouts_build_path)
    {
        var self = this.self;

        for (var layout_name in self._layouts) {
            ABLayouts.Layout.Build(self._layouts[layout_name].path,
                    layouts_build_path, true);
        }
    },

    _build_LayoutsInfo: function(build_path, layouts_build_path)
    {
        var self = this.self;

        var infos = {};

        for (var layout_name in self._layouts) {
            var layout_path = path.join(layouts_build_path, layout_name + '.json');
            if (!abFiles.file_Exists(layout_path))
                continue;

            infos[layout_name] = self._getPathUri(layout_path);
        }

        abFiles.file_PutContent(path.join(build_path, 'layouts.json'),
                JSON.stringify(infos));
    },

    _getPathUri: function(file_path)
    {
        var self = this.self;

        var relative_file_path = path.relative(self._basePath, file_path);
        return self._baseUri + relative_file_path.replace(/\\/g, '/');
    }

};
Layouts.Class.prototype = Layouts;
module.exports = Layouts;
