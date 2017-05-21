'use strict';

var Sync = require('./lib/sync.js');

exports.Lib = require('./lib.js');

exports.check = function() {
    return Sync.CheckAll();
};

exports.new = function(name) {
    return new Sync.Class(name);
};
