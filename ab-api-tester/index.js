'use strict';

var path = require('path');

var Lib = require('./Lib');

exports.Lib = Lib;

exports.new = function() {
    var args = [null];
    for (var i = 0; i < arguments.length; i++)
        args.push(arguments[i]);

    return new (Function.prototype.bind.apply(Lib.ApiTester.Class, args));
};

exports.refresh = function(r_module_path) {
    if (r_module_path in require.cache)
        delete require.cache[r_module_path];

    return require(r_module_path);
}
