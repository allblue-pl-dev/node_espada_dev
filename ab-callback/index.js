
var Callback = require('./lib/callback.js').Callback;


exports.Lib = require('./lib.js');

exports.new = function() {
    var args = [null];
    for (var i = 0; i < arguments.length; i++)
        args.push(arguments[i]);

    return new (Function.prototype.bind.apply(Callback.Class, args));
};
