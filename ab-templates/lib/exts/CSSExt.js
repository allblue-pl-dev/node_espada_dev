'use strict';

var path = require('path');

var abFiles = require('ab-files');
var abPathQuery = require('ab-path-query');
var less = require('less');

var Ext = require('../Ext');


var CssExt = {

    _pathQueries: null,
    _cssPaths: null,

    Class: function(template, args)
    {
        this.Class('CssExt', template);
        var self = this.self = this;

        self._pathQueries = [];
        self._cssPaths = [];
    }
};
var override = CssExt.Class.prototype = Object.create(Ext);
module.exports = CssExt;

override._build = function(sync, final)
{
    var self = this.self;

    self.log('Styles:');
    for (var i = 0; i < self._cssPaths.length; i++)
        self.log('    - ' + self._cssPaths[i]);

    if (final) {
        var template = self.getTemplate();

        var less_source = '';

        for (var i = 0; i < self._cssPaths.length; i++) {
            var relative_path = self._cssPaths[i];
            less_source += '@import (less) "' + relative_path + '";\r\n';
        }

        var compress = false;
        var dump_line_numbers = 'comments';

        if (final) {
            compress = true;
            dump_line_numbers = null
        }

        less.render(less_source, {
            paths: [template.getPath_Index()],
            filename: 'ab.less',
            compress: compress,
            dumpLineNumbers: dump_line_numbers,
            relativeUrls: true
        }, function(err, output) {
            if (err) {
                self.error('Error compiling less.');
                self.warn(err);
                self.warn('  File: ' + err.filename)
                self.warn('  Index: ' + err.index)
                self.warn('  Line: ' + err.line)

                return sync.finished();
            }

            var css_dir = path.join(template.getPath_Front(), 'css');
            if (!abFiles.dir_Exists(css_dir)) {
                self.warn('`%s` does not exist. Creating...', css_dir);
                abFiles.dir_Create(css_dir);
            }

            var index_path = template.getPath_Index();

            /* Replace `url` */
            var index_path_re = index_path
                .replace(/\./gm, '\\.')
                .replace(/\//gm, '\\/');

            var re = new RegExp('url\\((\'|")' + index_path_re, 'gm');
            var css = output.css.replace(re, "url($1" + template.getUri_Index());

            var css_path = path.join(css_dir, 'styles.min.css');

            abFiles.file_PutContent(css_path, css);

            self.success('Generated `css/styles.min.css`');

            var css_uri = template.getPathUri(css_path);

            template.addHeaderTag('link', {
                rel: "stylesheet",
                href: css_uri + '?v=' + self.getVersionHash(),
                type: "text/css"
            });

            return sync.finished();
        });
    } else {
        return sync.finished();
    }
};

override._parse_Post = function(final)
{
    var self = this.self;

    /* Header */
    var template = self.getTemplate();

    for (var i = 0; i < self._cssPaths.length; i++) {
        if (final)
            self._css += abFiles.file_GetContent(self._cssPaths[i]);
        else {
            var uri = template.getPathUri(self._cssPaths[i]);

            template.addHeaderTag('link', {
                rel: "stylesheet",
                href: uri + '?v=' + self.getVersionHash(),
                type: "text/css"
            });
        }
    }
};

override._parse_Pre = function()
{
    var self = this.self;

    self._pathQueries = [];
    self._cssPaths = [];

    self._css = '';
};

override._parse_TemplateInfo = function(template_info, template_path)
{
    var self = this.self;

    var template = self.getTemplate();

    if (!('css' in template_info))
        return;

    var css_paths = template_info.css;

    for (var i = 0; i < css_paths.length; i++) {
        var fp = abPathQuery.new(
                template_path + '/' + css_paths[i]);

        fp.onChange(function() {
            self._parse_TemplateInfo_CssPaths();
            template.build_Header();
        });

        self._pathQueries.push(fp);
    }

    self._parse_TemplateInfo_CssPaths();
};

override._parse_TemplateInfo_CssPaths = function()
{
    var self = this.self;

    for (var i = 0; i < self._pathQueries.length; i++) {
        var pq = self._pathQueries[i];

        var file_paths = pq.getFilePaths();
        self._cssPaths = self._cssPaths.concat(file_paths);

        var file_dirs = pq.getDirPaths();
        for (var j = 0; j < file_dirs.length; j++) {
            var d_file_paths = abPathQuery.getFilePaths(
                    file_dirs[j] + '/*.css');
            self._cssPaths.concat(file_paths);
        }
    }
};

override.unwatch = function()
{
    var self = this.self;

    for (var i = 0; i < self._pathQueries.length; i++)
        self._pathQueries[i].unwatch();
};

override.watch = function()
{
    var self = this.self;

    for (var i = 0; i < self._pathQueries.length; i++)
        self._pathQueries[i].watch();
};
