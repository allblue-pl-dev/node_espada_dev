'use strict';

var fs = require('fs');
var path  = require('path');

var abLog = require('ab-log');

var Helper = require('./helper.js').Helper;


var File = {

    Delete: function(file_path)
    {
        try {
            fs.unlink(file_path);
            return true;
        } catch (err) {
            return false;
        }
    },

    Exists: function(file_path)
    {
        var stat = Helper.GetStat(file_path);
        if (stat === null)
            return false;

        return stat.isFile();
    },

    GetContent: function(file_path)
    {
        try {
            return fs.readFileSync(file_path).toString();
        } catch (err) {
            abLog.error(err);
        }

        return null;
    },

    GetPathsFromDir: function(dir_path)
    {
        try {
            var t_files = fs.readdirSync(dir_path);

            var file_paths = [];
            for (var i = 0; i < t_files.length; i++) {
                var t_file_path = path.join(dir_path, t_files[i]);

                if (File.Exists(t_file_path))
                    file_paths.push(t_file_path);
            }

            return file_paths;
        } catch (err) {
            abLog.error(err);
        }

        return null;
    },

    PutContent: function(file_path, content)
    {
        try {
            var fd = fs.openSync(file_path, 'w');

            fs.writeSync(fd, content);

            fs.closeSync(fd);
        } catch (err) {
            abLog.error(err);
            return false;
        }

        return true;
    }

};
exports.File = File;
