'use strict';

var SPKExt = require('./lib/SPKExt');


exports.Lib = require('./Lib');

exports.new = function() {
    var args = [null];
    for (var i = 0; i < arguments.length; i++)
        args.push(arguments[i]);

    return new (Function.prototype.bind.apply(SPKExt.Class, args));
}
