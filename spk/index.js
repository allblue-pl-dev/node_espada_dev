'use strict';

var Layouts = require('./lib/Layouts');


exports.Lib = require('./Lib');
exports.newLayouts = function()
{
    var args = [null];
    for (var i = 0; i < arguments.length; i++)
        args.push(arguments[i]);

    return new (Function.prototype.bind.apply(Layouts.Class, args));
}
