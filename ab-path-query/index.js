
var PathQuery = require('./lib/PathQuery');


exports.Lib = require('./lib.js');
exports.getFileDirs = function(file_path) {
    return new PathQuery.Class(file_path).getFileDirs();
};
exports.getFilePaths = function(file_path) {
    return new PathQuery.Class(file_path).getFilePaths();
};
exports.getPaths = function(file_path) {
    return new PathQuery.Class(file_path).getPaths();
};
exports.new = function(files_path) {
    var args = [null];
    for (var i = 0; i < arguments.length; i++)
        args.push(arguments[i]);

    return new (Function.prototype.bind.apply(PathQuery.Class, args));
};
exports.watch = function(file_path, fn) {
    fp = new PathQuery.Class(file_path, true);
    fp.onChange(fn);
};
