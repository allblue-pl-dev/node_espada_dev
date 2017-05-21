
var abCallback = require('ab-callback');


var c = abCallback.new(function(args) {
    console.log(args);
});

c.call(1);
c.call(2);
c.call(3);

setTimeout(function() {
    c.call(4);
    c.call(5);
    c.call(6);
}, 90);

setTimeout(function() {
    c.call(4);
    c.call(5);
    c.call(6);
}, 200);
