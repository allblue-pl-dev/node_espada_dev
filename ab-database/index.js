'use strict';

const Database = require('./Lib/_Database');

module.exports.Lib = require('./Lib');
module.exports.create = function(connection_info) {
    return new Database.Class(connection_info);
};
