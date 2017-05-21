
var abSync = require('ab-sync');


var sync = abSync.new('test');

sync.join(function(sync) {
    setTimeout(function() {
        console.log('Magda')
        sync.finished();
    }, 3000);
}, 'magda');

sync.join(function(sync) {
        console.log(' ma');
        sync.finished();
    }, function(name) {
        console.log('`%s` finished.', name);
    }, 'ma');

sync.join(function(sync) {
    setTimeout(function() {
        console.log(' bardzo');
        sync.finished();
    }, 3000);
},'bardzo');

[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (i) {
    sync.async(function(sync) {
        setTimeout(function() {
            console.log(' dużego');

            sync.join(function(sync) {
                setTimeout(function() {
                    console.log(1);
                    // sync.finished();
                }, 500);
            }, 'one');

            sync.join(function(sync) {
                setTimeout(function() {
                    console.log(2);
                    sync.finished();
                }, i * 500);
            }, 'two');

            sync.finished();
        }, 500);
    }, 'async');
});

sync.join(function(sync) {
    setTimeout(function() {
        console.log(' psa.');
        sync.finished();
    }, 3000);
}, 'psa');

process.on('exit', function() {
    abSync.check();
});
