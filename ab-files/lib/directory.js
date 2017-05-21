'use strict';

var fs = require('fs');
var path = require('path');
var Helper = require('./helper.js').Helper;


var Directory = {

    Create: function(dir_path)
    {
        var abs_dir_path = path.resolve(dir_path);
        var dir_path_array = abs_dir_path.split(path.sep);

        if (dir_path_array.length === 0)
            return;

        var i = 0;
        var t_dir_path = dir_path_array[i];
        while (true) {
            i++;
            if (i >= dir_path_array.length)
                break;

            t_dir_path = path.join(t_dir_path, dir_path_array[i]);

            if (!Directory.Exists(t_dir_path))
                fs.mkdirSync(t_dir_path);
        }
    },

    Exists: function(dir_path)
    {
        var stat = Helper.GetStat(dir_path);
        if (stat === null)
            return false;

        return stat.isDirectory();
    }

};
exports.Directory = Directory;
