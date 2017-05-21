'use strict';

var fs = require('fs');


var Helper = {

    GetStat: function(path)
    {
        try {
            return fs.lstatSync(path);
        } catch (e) {
            return null;
        }
    }

};
exports.Helper = Helper;
