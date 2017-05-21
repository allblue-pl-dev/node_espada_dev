'use strict';

var path = require('path');

var spkiles = require('ab-files');
var abPathQuery = require('ab-path-query');
var abWatcher = require('ab-watcher');

var ABLayouts = require('ab-layouts').Lib;
var SPK = require('spk').Lib;

var ABTemplates = require('ab-templates').Lib;


var SPKExt = {

    _layouts_PathQueries: null,
    _layouts_Watchers: null,

    _spkLayouts: null,

    Class: function(template, args)
    {
        this.Class('SPKExt', template);
        var self = this.self = this;

        self._layouts_PathQueries = [];
        self._layouts_Watchers = [];
    }

}
var override = SPKExt.Class.prototype = Object.create(ABTemplates.Ext);
module.exports = SPKExt;

override._build = function(sync, final)
{
    var self = this.self;

    var template = self.getTemplate();

    self.log('Building layouts info...');

    self.log('Layouts:');
    var spk_layouts = self.spkLayouts.getLayouts();
    for (var spk_layout_name in spk_layouts) {
        self.log('    - %s: %s', spk_layout_name,
                spk_layouts[spk_layout_name].uri);
    }

    self.spkLayouts.build(template.getPath_Front());
    self.success('Building layouts info finished.');

    return sync.finished();
};

override._parse_Pre = function()
{
    var self = this.self;

    var template = self.getTemplate();

    self.spkLayouts = new SPK.Layouts.Class(template.getPath_Index(), '');

    self._layouts_PathQueries = [];
    self._layouts_Paths = [];
};

override._parse_TemplateInfo = function(template_info, template_path)
{
    var self = this.self;

    var template = self.getTemplate();

    if (!('spk' in template_info))
        return;

    var spk_info = template_info.spk;

    self._parse_TeamplateInfo_PathQueries(spk_info, template_path);

    if ('layouts' in spk_info)
        self._parse_TemplateInfo_Layouts(spk_info.layouts);
};

override._parse_TemplateInfo_Layouts = function()
{
    var self = this.self;

    var template = self.getTemplate();
    var layouts_build_path = path.join(template.getPath_Front(), 'layouts');

    if (!spkiles.dir_Exists(layouts_build_path))
        spkiles.dir_Create(layouts_build_path);

    self._layouts_PathQueries.forEach(function(pq) {
        var file_paths = pq.getFilePaths();

        file_paths.forEach(function(file_path) {
            var layout_name = path.basename(file_path, '.html');

            self.spkLayouts.add(layout_name, file_path,
                    template.getPathUri(file_path));

            /* Watcher */
            var watcher = abWatcher.new([file_path], function() {
                if (!spkiles.file_Exists(file_path))
                    return;

                if (ABLayouts.Layout.Build(file_path, layouts_build_path, true))
                    self.success('Built SPK Layout `%s`.', file_path);
            }, false);

            self._layouts_Watchers.push(watcher);
        });
    });
};

override._parse_TeamplateInfo_PathQueries = function(spk_info, template_path)
{
    var self = this.self;

    var template = self.getTemplate();

    if ('layouts' in spk_info) {
        spk_info.layouts.forEach(function(layout_path) {
            var pq = abPathQuery.new(template_path + '/' + layout_path);

            pq.onChange(function() {
                self.parse();
                self.build();
            });

            self._layouts_PathQueries.push(pq);
        });
    }
};

override.unwatch = function()
{
    var self = this.self;

    for (var i = 0; i < self._layouts_PathQueries.length; i++)
        self._layouts_PathQueries[i].unwatch();

    for (var i = 0; i < self._layouts_Watchers.length; i++)
        self._layouts_Watchers[i].unwatch();
};

override.watch = function()
{
    var self = this.self;

    for (var i = 0; i < self._layouts_PathQueries.length; i++)
        self._layouts_PathQueries[i].watch();

    for (var i = 0; i < self._layouts_Watchers.length; i++)
        self._layouts_Watchers[i].watch();
};
