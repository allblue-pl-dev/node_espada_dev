'use strict';

var abLog = require('ab-log');
var abTypes = require('ab-types');


var Sync = {
    self: null,

    _Instances: [],
    _NextId: 0,

    CheckAll: function()
    {
        for (var i = 0; i < Sync._Instances.length; i++)
            Sync._Instances[i].check();
    },

    _GetNextName: function()
    {
        var name = 'Sync-' + Sync._NextId;
        Sync._NextId++;

        return name;
    },


    _name: '',

    _fnInfo: null,
    _finished: false,
    _currentFns: null,

    _parent: null,
    _id: -1,

    _nextFn: 0,

    Class: function(name, parent, id)
    {
        this.self = this;
        var self = this.self;

        parent = typeof parent === 'undefined' ? null : parent;

        self._name = typeof name === 'undefined' ?
                Sync._GetNextName() : name;

        self._fnInfos = [];
        self._currentFns = [];

        self._parent = parent;
        if (parent !== null)
            self._id = id;

        Sync._Instances.push(self);
    },

    async: function()
    {
        var self = this.self;

        if (self._finished)
            throw new Error('Cannot add `Function` after finising sync.');

        var fn_info = self._getFnInfoFromArgs(arguments, true);
        self._fnInfos.push(fn_info);
        var fn_i = self._fnInfos.length - 1;

        if (self._currentFns.length === 0)
            self._execNext();
        else if (self._fnInfos[self._currentFns[0]].async)
            self._execNext();
    },

    check: function()
    {
        var self = this.self;

        var checks_out = true;

        if ((!self._finished && self._parent !== null)) {
            abLog.error('ABSync `%s` stack not empty:', self._name);
            abLog.warn(self._parent);

            checks_out = false;
        }

        return checks_out;
    },

    finished: function()
    {
        var self = this.self;

        if (self._finished)
            throw new Error('`Sync` finished for the second time.');

        self._finished = true;

        if (self._currentFns.length !== 0)
            return;

        if (self._parent !== null)
            self._parent._childFinished(self._id);
    },

    join: function()
    {
        var self = this.self;

        if (self._finished)
            throw new Error('Cannot add `Function` after finising sync.');

        var fn_info = self._getFnInfoFromArgs(arguments, false);
        self._fnInfos.push(fn_info);
        var fn_i = self._fnInfos.length - 1;

        if (self._currentFns.length === 0)
            self._execNext();
    },

    _childFinished: function(id)
    {
        var self = this.self;

        var current_fn_info_i = self._currentFns.indexOf(id);
        if (current_fn_info_i === -1)
            throw new Error('Finished unknown `Function`.');

        var fn_info = self._fnInfos[id];
        if (fn_info.finishedFn !== null)
            fn_info.finishedFn(fn_info.name);

        self._currentFns.splice(current_fn_info_i, 1);

        if (self._currentFns.length === 0)
            self._execNext();
    },

    _execNext: function(name)
    {
        var self = this.self;

        if (self._nextFn >= self._fnInfos.length) {
            if (self._finished) {
                if (self._parent !== null)
                    self._parent._childFinished(self._id);
            }

            return;
        }

        var start_fn_i = self._nextFn;

        var new_fns = [];
        new_fns.push(self._nextFn);
        self._currentFns.push(self._nextFn);

        var fn_info = self._fnInfos[self._nextFn];

        self._nextFn++;
        if (fn_info.async) {
            while (true) {
                if (self._nextFn >= self._fnInfos.length)
                    break;

                if (!self._fnInfos[self._nextFn].async)
                    break;

                new_fns.push(self._nextFn);
                self._currentFns.push(self._nextFn);
                self._nextFn++;
            }
        }

        for (var i = 0; i < new_fns.length; i++) {
            var t_fn_info = self._fnInfos[new_fns[i]];

            var sync = new Sync.Class(t_fn_info.name, self, start_fn_i + i);
            t_fn_info.fn(sync);
        }
    },

    _getFnInfoFromArgs: function(args, asynchronous)
    {
        var self = this.self;

        var fn;
        var name = self._name + ':';
        var finished_fn = null;

        if (args.length === 1) {
            if (!abTypes.isFunction(args[0]))
                throw new TypeError();

            fn = args[0];
            name += Sync._GetNextName();
        } else if (args.length === 2) {
            if (!abTypes.isFunction(args[0]))
                throw new TypeError();

            fn = args[0];

            if (abTypes.isFunction(args[1])) {
                name += Sync._GetNextName();
                finished_fn = args[1];
            } else if (abTypes.isString(args[1]))
                name += args[1];
            else
                throw new TypeError();
        } else {
            if (!abTypes.isFunction(args[0]) ||
                    !abTypes.isFunction(args[1]) ||
                    !abTypes.isString(args[2]))
                throw new TypeError();

            fn = args[0];
            name += args[2];
            finished_fn = args[1];
        }

        return {
            async: asynchronous,
            fn: fn,
            name: name,
            finishedFn:  finished_fn
        };
    }

};
Sync.Class.prototype = Sync;
module.exports = Sync;
