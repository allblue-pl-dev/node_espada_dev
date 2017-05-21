'use strict';


exports.getType = function(variable) {
    var type = Object.prototype.toString.call(variable);

    return type.substring(8, type.length - 1);
};

exports.isArray = function(variable) {
    if (Object.prototype.toString.call(variable) === '[object Array]')
        return true;

    return false;
};

exports.isFunction = function(variable) {
    if (Object.prototype.toString.call(variable) === '[object Function]')
        return true;

    return false;
};

exports.isNumber = function(variable) {
    if (Object.prototype.toString.call(variable) === '[object Number]')
        return true;

    return false;
};

exports.isObject = function(variable) {
    if (Object.prototype.toString.call(variable) === '[object Object]')
        return true;

    return false;
};

exports.isString = function(variable) {
    if (Object.prototype.toString.call(variable) === '[object String]')
        return true;

    return false;
};
