
var Recall = require('./lib/recall.js');


exports.Lib = require('./lib.js');

exports.new = function(fn, name) {
    return new Recall.Class(fn, name);
};
