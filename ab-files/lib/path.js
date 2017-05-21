'use strict';

var abLog = require('ab-log');

var Helper = require('./helper.js').Helper;


var Path = {

    Exists: function(file_path)
    {
        var stat = Helper.GetStat(file_path);
        if (stat === null)
            return false;

        return true;
    }

};
exports.Path = Path;
