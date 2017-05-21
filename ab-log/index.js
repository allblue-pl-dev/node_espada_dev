'use strict';

var chalk = require('chalk');


module.exports = {
    error: function() {
        arguments[0] = chalk.red(arguments[0]);
        console.error.apply(console, arguments);
    },
    log: function() {
        console.log.apply(console, arguments);
    },
    success: function(msg) {
        arguments[0] = chalk.green(arguments[0]);
        console.log.apply(console, arguments);
    },
    warn: function(msg) {
        arguments[0] = chalk.yellow(arguments[0]);
        console.warn.apply(console, arguments);
    }
};
