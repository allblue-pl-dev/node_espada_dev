'use strict';

var abLog = require('ab-log');
var abRecalls = require('ab-recall');


var Ext = {
    self: null,

    _name: '',
    _template: null,

    _recalls_Build: null,

    Class: function(name, template)
    {
        var self = this.self = this;

        self._name = name;
        self._template = template;

        self._initializeRecalls();
    },

    build: function()
    {
        var self = this.self;

        self._recalls_Build.call();
    },

    build_Sync: function(sync)
    {
        var self = this.self;

        self._recalls_Build.call(sync);
    },

    error: function()
    {
        var self = this.self;

        arguments[0] = self._name + ': ' + arguments[0];

        abLog.error.apply(abLog, arguments);
    },

    getName: function()
    {
        var self = this.self;

        return self._name;
    },

    getTemplate: function()
    {
        var self = this.self;

        return self._template;
    },

    getVersionHash: function()
    {
        return this._template.getVersionHash();
    },

    log: function()
    {
        var self = this.self;

        arguments[0] = self._name + ': ' + arguments[0];

        abLog.log.apply(abLog, arguments);
    },

    parse: function()
    {
        var self = this.self;

        var template = this.getTemplate();

        var templates = self._template.getTemplateInfos();

        if (self._template.isWatching())
            self.unwatch();

        self._parse_Pre(template._final);

        for (var i = 0; i < templates.length; i++)
            self._parse_TemplateInfo(templates[i].info, templates[i].path);

        self._parse_Post(template._final);

        if (self._template.isWatching())
            self.watch();
    },

    success: function()
    {
        var self = this.self;

        arguments[0] = self._name + ': ' + arguments[0];

        abLog.success.apply(abLog, arguments);
    },

    unwatch: function()
    {
        var self = this.self;
    },

    warn: function()
    {
        var self = this.self;

        arguments[0] = self._name + ': ' + arguments[0];

        abLog.warn.apply(abLog, arguments);
    },

    watch: function()
    {
        var self = this.self;
    },

    _initializeRecalls: function()
    {
        var self = this.self;

        var template = this.getTemplate();

        self._recalls_Build = abRecalls.new(function(sync, args) {
            self.log('Building...');

            sync.join(function(sync) {
                self._build(sync, template._final);
            }, 'build');

            sync.join(function(sync) {
                for (var i = 0; i < args.length; i++)
                    if (args[i].length > 0)
                        args[i][0].finished();

                self.success('Building finished.');

                return sync.finished();
            }, 'finish');

            return sync.finished();
        }, 'ext_' + self._name);
    },

    /* Overrides */
    _build: function()
    {
        var self = this.self;

        throw new Error('`_build` not implemented.');
    },

    _parse_Post: function()
    {
        var self = this.self;
    },

    _parse_Pre: function()
    {
        var self = this.self;
    },

    parse_TemplateInfo: function(template_info, template_path)
    {
        var self = this.self;
    },

};
var override = Ext.Class.prototype = Ext;
module.exports = Ext;
