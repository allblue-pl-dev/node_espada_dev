'use strict';

var fs = require('fs');
var path = require('path');

var abFiles = require('ab-files');
var abWatcher = require('ab-watcher');


var PathQuery = {
    self: null,

    _pathQueriesArray: null,

    _paths: null,
    _dirPaths: null,
    _filePaths: null,

    _listeners_OnChange: null,

    _watcher: null,
    _watcher_FilePaths: null,

    _watchFileChanges: false,

    Class: function(files_path, watch_file_changes)
    {
        var self = this.self = this;

        self._watchFileChanges = typeof watch_file_changes === 'undefined' ?
                false : watch_file_changes;

        self._paths = [];
        self._dirPaths = [];
        self._filePaths = [];

        self._pathQueriesArray = files_path.split('/');
        self._listeners_OnChange = [];

        self._watcher_FilePaths = [];

        self._updatePaths();
    },

    getDirPaths: function()
    {
        var self = this.self;

        return self._dirPaths;
    },

    getFilePaths: function()
    {
        var self = this.self;

        return this._filePaths;
    },

    getPaths: function()
    {
        var self = this.self;

        return self._paths;
    },

    onChange: function(fn)
    {
        var self = this.self;

        self._listeners_OnChange.push(fn);
    },

    watch: function()
    {
        var self = this.self;

        if (self._watcher !== null)
            return;

        self._watcher = abWatcher.new(self._watcher_FilePaths, function() {
            self._updatePaths();
        });
        self._watcher.watch();
    },

    unwatch: function()
    {
        var self = this.self;

        if (self._watcher === null)
            return;

        self._watcher.unwatch();
        self._watcher = null;
    },

    _updatePaths: function()
    {
        var self = this.self;

        var old_paths = self._paths.slice();

        self._paths = [];
        self._filePaths = [];
        self._dirPaths = [];

        self._watcher_FilePaths = [];

        var file_paths = ['.'];
        for (var i = 0; i < self._pathQueriesArray.length; i++) {
            var files_path_part = self._pathQueriesArray[i];
            var new_file_paths = [];

            if (files_path_part === '*') {
                for (var j = 0; j < file_paths.length; j++) {
                    try {
                        var file_path_files = fs.readdirSync(file_paths[j]);

                        for (var k = 0; k < file_path_files.length; k++) {
                            var new_file_path = path.join(file_paths[j],
                                    file_path_files[k]);

                            if (i === self._pathQueriesArray.length - 1) {
                                if (abFiles.dir_Exists(new_file_path))
                                    self._updatePaths_AddDirPath(new_file_path);
                                else
                                    self._updatePaths_AddFilePath(new_file_path);
                            } else if (abFiles.dir_Exists(new_file_path)) {
                                new_file_paths.push(new_file_path);
                                self._watcher_FilePaths.push(new_file_path);
                            }
                        }
                    } catch (err) {
                        continue;
                    }
                }
            } else {
                for (var j = 0; j < file_paths.length; j++) {
                    var new_file_path =
                            path.join(file_paths[j], files_path_part);

                    if (i === self._pathQueriesArray.length - 1) {
                        if (abFiles.dir_Exists(new_file_path))
                            self._updatePaths_AddDirPath(new_file_path);
                        else
                            self._updatePaths_AddFilePath(new_file_path);
                    } else if (abFiles.dir_Exists(new_file_path)) {
                        new_file_paths.push(new_file_path);
                        self._watcher_FilePaths.push(new_file_path);
                    }
                }
            }

            file_paths = new_file_paths;
        }

        var changed = false;

        if (old_paths.length !== self._paths.length)
            changed = true;
        else {
            for (var i = 0; i < old_paths.length; i++) {
                if (old_paths[i] !== self._paths[i]) {
                    changed = true;
                    break;
                }
            }
        }

        if (!changed && !self._watchFileChanges)
            return;

        if (self._watcher !== null) {
            self._watcher.updateFiles(self._watcher_FilePaths);
        }

        for (var i = 0; i < self._listeners_OnChange.length; i++)
            self._listeners_OnChange[i]();
    },

    _updatePaths_AddDirPath: function(dir_path)
    {
        var self = this.self;

        self._paths.push(dir_path);
        self._dirPaths.push(dir_path);
    },

    _updatePaths_AddFilePath: function(file_path)
    {
        var self = this.self;

        var file_path_array = file_path.split('*');

        /* Regular File */
        if (file_path_array.length === 1) {
            var t_file_path = file_path_array[0];

            if (!abFiles.file_Exists(t_file_path))
                return;

            self._paths.push(t_file_path);
            self._filePaths.push(t_file_path);

            return;
        }

        /* File with `*` */
        var dir_path = file_path_array[0];

        if (!abFiles.dir_Exists(dir_path))
            return;
        var t_file_paths = abFiles.file_GetPathsFromDir(dir_path);

        for (var i = 0; i < t_file_paths.length; i++) {
            var t_file_path = t_file_paths[i];
            var ext = file_path_array[1];

            if (t_file_path.indexOf(file_path_array[1]) !==
                    t_file_path.length - ext.length)
                continue;

            self._paths.push(t_file_path);
            self._filePaths.push(t_file_path);
        }
    },

    _updateWatchers: function()
    {
        var self = this.self;


    }

};
PathQuery.Class.prototype = PathQuery;
module.exports = PathQuery;
