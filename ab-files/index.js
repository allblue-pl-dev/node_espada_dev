'use strict';

var Directory = require('./lib/directory.js').Directory;
var File = require('./lib/file.js').File;
var Path = require('./lib/path.js').Path;


exports.Lib = require('./lib.js');

exports.dir_Create = Directory.Create;
exports.dir_Exists = Directory.Exists;

exports.file_Delete = File.Delete;
exports.file_Exists = File.Exists;
exports.file_GetContent = File.GetContent;
exports.file_GetPathsFromDir = File.GetPathsFromDir;
exports.file_PutContent = File.PutContent;

exports.path_Exists = Path.Exists;
