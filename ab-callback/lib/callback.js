'use strict';

var abTypes = require('ab-types');


var Callback = {
    self: null,

    _callsCount: 0,
    _args: null,

    _fn: null,
    _children: null,
    _waitTime: 100,

    Class: function()
    {
        var self = this.self = this;

        var fn = null;
        var children = [];
        var wait_time = self._waitTime;

        for (var i = 0; i < arguments.length; i++) {
            var arg = arguments[i];

            if (abTypes.isFunction(arg))
                fn = arg;
            else if (abTypes.isObject(arg))
                children.push(arg);
            else if (abTypes.isNumber(arg))
                wait_time = arg;
            else {
                throw new TypeError('Argument `' + abTypes.getType(arg) +
                        '` should be a `Function`,' +
                        ' `Callback Object` or a `Number`.');
            }
        }

        self._fn = fn;
        self._children = children;
        self._waitTime = wait_time;

        self._args = [];
    },

    addChild: function(child)
    {
        var self = this.self;

        self._children.push(child);
    },

    call: function()
    {
        var self = this.self;

        self._args.push(arguments);

        self._callFn(self._waitTime);
    },

    _callFn: function(args, wait_time_modifier)
    {
        var self = this.self;

        var wait_time;
        if (self._waitTime < wait_time_modifier)
            wait_time = wait_time_modifier;
        else
            wait_time = self._waitTime;

        for (var i = 0; i < self._children.length; i++)
            self._children[i]._callFn({}, wait_time);

        self._callsCount++;
        setTimeout(function() {
            self._callsCount--;
            if (self._callsCount > 0)
                return;

            if (self._fn !== null) {
                var args = self._args;
                self._args = [];

                self._fn(args);
            }
        }, wait_time);
    },

};
Callback.Class.prototype = Callback;
exports.Callback = Callback;
