'use strict';

var path = require('path');

var abCallback = require('ab-callback');
var abFiles = require('ab-files');
var abPathQuery = require('ab-path-query');
var less = require('less');

var Ext = require('../Ext');



var LessExt = {

    _filesPaths: null,
    _lessPathQueries: null,

    _variablePaths: null,
    _stylesPaths: null,

    Class: function(template)
    {
        this.Class('LessExt', template);
        var self = this.self = this;

        self._filesPaths = [];
        self._lessPathQueries = [];

        self._variablePaths = [];
        self._stylesPaths = [];
    }
};
var override = LessExt.Class.prototype = Object.create(Ext);
module.exports = LessExt;

override.unwatch = function()
{
    var self = this.self;

    for (var i = 0; i < self._filesPaths.length; i++)
        self._filesPaths[i].unwatch();

    for (var i = 0; i < self._lessPathQueries.length; i++)
        self._lessPathQueries[i].unwatch();
};

override.watch = function()
{
    var self = this.self;

    for (var i = 0; i < self._filesPaths.length; i++)
        self._filesPaths[i].watch();

    for (var i = 0; i < self._lessPathQueries.length; i++)
        self._lessPathQueries[i].watch();
};

override._build = function(sync, final)
{
    var self = this.self;

    var template = self.getTemplate();

    self.log('Variables:');
    var less_source = '';
    for (var i = 0; i < self._variablePaths.length; i++) {
        var relative_path =self._variablePaths[i];
        less_source += '@import "' + relative_path + '";\r\n';

        self.log('    - ' + relative_path);
    }
    less_source += '\r\n';

    self.log('Styles:');
    for (var i = 0; i < self._stylesPaths.length; i++) {
        var relative_path = self._stylesPaths[i];
        less_source += '@import "' + relative_path + '";\r\n';

        self.log('    - ' + relative_path);
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

        abFiles.file_PutContent(path.join(css_dir, 'ab-template.css'), css);

        self.success('Generated `css/ab-template.css`');

        return sync.finished();
    });
};


override._parse_Post = function()
{
    var self = this.self;

    var template = self.getTemplate();

    var css_uri = template.getPathUri(
            path.join(template.getPath_Front(), 'css/ab-template.css'));

    template.addHeaderTag('link', {
        rel: "stylesheet",
        href: css_uri + '?v=' + self.getVersionHash(),
        type: "text/css"
    });
};

override._parse_Pre = function()
{
    var self = this.self;

    self._filesPaths = [];
    self._lessPathQueries = [];

    self._variablePaths = [];
    self._stylesPaths = [];
};

override._parse_TemplateInfo = function(template_info, template_path)
{
    var self = this.self;

    var template = self.getTemplate();

    if (!('less' in template_info))
        return;

    var less_dirs = template_info.less;

    for (var i = 0; i < less_dirs.length; i++) {
        var fp = abPathQuery.new(
                template_path + '/' + less_dirs[i]);

        fp.onChange(function() {
            self.parse();
            self.build();
            template.build_Header();
        });

        self._filesPaths.push(fp);

        /* Variables Files Path */
        var less_fp = abPathQuery.new(template_path + '/' + less_dirs[i] +
                '/*.less', true);

        less_fp.onChange(function() {
            self.build();
        });

        self._lessPathQueries.push(less_fp);
    }

    self._parse_TemplateInfo_LessPaths();
};

override._parse_TemplateInfo_LessPaths = function()
{
    var self = this.self;

    for (var i = 0; i < self._filesPaths.length; i++) {
        var fp = self._filesPaths[i];

        var file_dirs = fp.getDirPaths();
        for (var j = 0; j < file_dirs.length; j++) {
            var variables_path = path.join(file_dirs[j], 'variables.less');
            var styles_path = path.join(file_dirs[j], 'styles.less');

            if (abFiles.file_Exists(variables_path))
                self._variablePaths.push(variables_path);
            if (abFiles.file_Exists(styles_path))
                self._stylesPaths.push(styles_path);
        }
    }
};
