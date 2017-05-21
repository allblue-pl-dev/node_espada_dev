'use strict';

var abCallback = require('ab-callback');
var abSync = require('ab-sync');


var Recall = {
    self: null,

    _NextId: 0,

    _GetNextName: function()
    {
        var id = 'Recall-' + Recall._NextId;
        Recall._NextId++;

        return id;
    },


    _callback: null,

    _isExecuting: false,
    _recall: false,

    _args: null,

    Class: function(fn, sync_name)
    {
        var self = this.self = this;

        sync_name = typeof sync_name === 'undefined' ?
                Recall._GetNextName() : sync_name;

        self._args = [];

        self._callback = abCallback.new(function(callback_args) {
            if (self._isExecuting) {
                self._rebuild = true;
                self._args.push(callback_args);
                return;
            }

            self._isExecuting = true;
            self._rebuild = false;

            var sync = abSync.new(sync_name);

            sync.join(function(sync) {
                return fn(sync, callback_args);
            }, 'fn');

            sync.join(function(sync) {
                self._isExecuting = false;
                if (self._rebuild) {
                    var args = self._args;
                    self._args = [];

                    for (var i = 0; i < args.length; i++) {
                        for (var j = 0; j < args[i].length; j++) {
                            self._callback.call.apply(self._callback,
                                    args[i][j]);
                        }
                    }
                }

                return sync.finished();
            }, 'after');
        });
    },

    call: function()
    {
        var self = this.self;

        self._callback.call.apply(self._callback, arguments);
    }

};
Recall.Class.prototype = Recall;
module.exports = Recall;
