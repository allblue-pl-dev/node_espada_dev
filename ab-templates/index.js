'use strict';

var fs = require('fs');
var path = require('path');

var abFiles = require('ab-files');
var abLog = require('ab-log');
var abTypes = require('ab-types');
var abSync = require('ab-sync');

var ABWatcher = require('ab-watcher').Lib.Watcher;

var Template = require('./lib/template.js');


exports.Lib = require('./Lib.js');

exports.build = function(template_path, exts) {
    var t = new Template.Class(template_path);

    for (var i = 0; i < exts.length; i++) {
        if (abTypes.isString(exts[i]))
            t.ext(exts[i]);
        else if (abTypes.isArray(exts[i])) {
            if (exts[i].length === 1)
                t.ext(exts[i][0]);
            else if (exts[i].length >= 2)
                t.ext(exts[i][0], exts[i][1]);
        } else
            throw new TypeError('`ext` should be String or Array');
    }

    t.parse();
    t.build();
};

exports.new = function() {
    var args = [null];
    for (var i = 0; i < arguments.length; i++)
        args.push(arguments[i]);

    return new (Function.prototype.bind.apply(Template.Class, args));
};

exports.watch = function(template_path, exts, final) {
    var t = new Template.Class(template_path, final);

    for (var i = 0; i < exts.length; i++) {
        if (abTypes.isString(exts[i]))
            t.ext(exts[i]);
        else if (abTypes.isArray(exts[i])) {
            if (exts[i].length === 1)
                t.ext(exts[i][0]);
            else if (exts[i].length >= 2)
                t.ext(exts[i][0], exts[i][1]);
        } else
            throw new TypeError('`ext` should be String or Array');
    }

    t.parse();
    t.build(final);

    t.watch();
};
