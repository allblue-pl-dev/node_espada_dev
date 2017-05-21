
var abRecall = require('ab-recall');
var abSync = require('ab-sync');


var r = abRecall.new(function(sync, args) {
    setTimeout(function() {
        console.log(args);
        // sync.finished();
    }, 1000);
}, 'MyRecall');


r.call(1);
r.call(2);
r.call(3);

setTimeout(function() {
    r.call(4);
    r.call(5);
    r.call(6);
}, 90);

setTimeout(function() {
    r.call(4);
    r.call(5);
    r.call(6);
}, 200);


process.on('exit', function() {
    abSync.check();
});
