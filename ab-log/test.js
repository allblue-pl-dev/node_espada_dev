'use strict';

var abLog = require('./index.js');


abLog.log('Log.');
abLog.success('Success.');
abLog.warning('Warning.');
abLog.error('Error: `%s`.', 'This is my error');
