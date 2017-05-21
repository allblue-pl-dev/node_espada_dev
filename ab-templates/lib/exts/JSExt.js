'use strict';

var path = require('path');

var abFiles = require('ab-files');
var abPathQuery = require('ab-path-query');
var uglifyJS = require('uglify-js');

var Ext = require('../Ext');


var JSExt = {

    _filesPaths: null,
    _jsPaths: null,

    Class: function(template)
    {
        this.Class('JSExt', template);
        var self = this.self = this;

        self._filesPaths = [];
        self._jsPaths = [];
    }
};
var override = JSExt.Class.prototype = Object.create(Ext);
module.exports = JSExt;

override._build = function(sync, final)
{
    var self = this.self;

    self.log('Scripts:');
    for (var i = 0; i < self._jsPaths.length; i++)
        self.log('    - ' + self._jsPaths[i]);

    if (final) {
        var script_path = self.getTemplate().getPath_Front() +
                '/script.js';
        var min_script_path = self.getTemplate().getPath_Front() +
                '/script.min.js';

        abFiles.file_PutContent(script_path, self._js);

        try {
            var script = uglifyJS.minify([ script_path ], {
                compress: {
                    dead_code: true,
                    global_defs: {
                        DEBUG: false
                    }
                }
            });

            abFiles.file_Delete(script_path);
            abFiles.file_PutContent(min_script_path, script.code);

            var template = self.getTemplate();

            var uri = template.getPathUri(min_script_path);

            template.addHeaderTag('script', {
                src: uri + '?v=' + self.getVersionHash(),
                type: 'text/javascript'
            });
        } catch (err) {
            self.error(err);
        }
    }

    return sync.finished();
};

override._parse_Post = function(final)
{
    var self = this.self;

    /* Header */
    var template = self.getTemplate();

    for (var i = 0; i < self._jsPaths.length; i++) {
        if (final)
            self._js += abFiles.file_GetContent(self._jsPaths[i]);
        else {
            var uri = template.getPathUri(self._jsPaths[i]);

            template.addHeaderTag('script', {
                src: uri + '?v=' + self.getVersionHash(),
                type: 'text/javascript'
            });
        }
    }
};

override._parse_Pre = function()
{
    var self = this.self;

    self._filesPaths = [];
    self._jsPaths = [];

    self._js = '';
};

override._parse_TemplateInfo = function(template_info, template_path)
{
    var self = this.self;

    var template = self.getTemplate();

    if (!('js' in template_info))
        return;

    var js_paths = template_info.js;

    js_paths.forEach(function(js_path) {
        var pq = abPathQuery.new(
                template_path + '/' + js_path);

        pq.onChange(function() {
            self._parse_TemplateInfo_JSPaths();
            template.build_Header();
        });

        self._filesPaths.push(pq);
    });

    self._parse_TemplateInfo_JSPaths();
};

override._parse_TemplateInfo_JSPaths = function()
{
    var self = this.self;

    for (var i = 0; i < self._filesPaths.length; i++) {
        var pq = self._filesPaths[i];

        var file_paths = pq.getFilePaths();

        var file_dirs = pq.getDirPaths();
        for (var j = 0; j < file_dirs.length; j++) {
            var d_file_paths = abPathQuery.getFilePaths(
                    file_dirs[j] + '/*.js');

            file_paths = file_paths.concat(file_dirs);
        }

        for (var k = 0; k < file_paths.length; k++) {
            var index = self._jsPaths.indexOf(file_paths[k]);
            if (index !== -1)
                self._jsPaths.splice(index, 1);

            self._jsPaths.push(file_paths[k]);
        }
    }
};

override.unwatch = function()
{
    var self = this.self;

    for (var i = 0; i < self._filesPaths.length; i++)
        self._filesPaths[i].unwatch();
};

override.watch = function()
{
    var self = this.self;

    for (var i = 0; i < self._filesPaths.length; i++)
        self._filesPaths[i].watch();
};
