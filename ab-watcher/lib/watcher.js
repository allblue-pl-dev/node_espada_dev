'use strict';

var fs = require('fs');

var abCallback = require('ab-callback');


var Watcher = {
    self: null,

    _files: null,
    _fn: null,

    _callsCount: 0,
    _waitTime: 100,

    Class: function(files, fn, watch)
    {
        var self = this.self = this;

        watch = typeof watch === 'undefined' ? true : watch;

        self._files = files;
        self._fn = fn;

        self._callback = abCallback.new(function(args) {
            self._fn(args);
        });

        if (watch)
            self.watch();
    },

    updateFiles: function(files)
    {
        var self = this.self;

        self.unwatch();
        self._files = files;
        self.watch();
    },

    watch: function()
    {
        var self = this.self;

        self._files.forEach(function(file) {
            fs.watch(file, function(evt, filename) {
                self._callback.call(evt, filename);
            });
        });
    },

    unwatch: function()
    {
        var self = this.self;

        for (var i = 0; i < self._files.length; i++)
            fs.unwatchFile(self._files[i], self._callback);
    },

};
Watcher.Class.prototype = Watcher;
module.exports = Watcher;
