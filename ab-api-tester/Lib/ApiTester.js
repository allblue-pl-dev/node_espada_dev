'use strict';

var fs = require('fs');
var http = require('http');
var path = require('path');
var os = require('os');
var url = require('url');

var abFiles = require('ab-files');
var abLog = require('ab-log');
var mime = require('mime');
var request = require('request');


var ApiTester = {

    _TestArgs_Required: [ 'name', 'uri' ],
    _TestArgs_Optional: {
        method: 'post',
        fields: null,
        test: null
    },


    _mediaPath: '',

    _testsDir: null,
    _hostname: '',

    Class: function(tests_dir)
    {
        this._testsDir = tests_dir;
        /* Might think about resolving `localhost` to local network address. */
        this._hostname = 'http://' + this._getHostname();

        console.log('Listening on: ' + this._hostname);

        this._mediaPath = path.join(__dirname, '../media');
    },

    start: function()
    {
        var self = this;
        var server = http.createServer(function(request, response) {
            var uri_info = url.parse(request.url);

            /* Check if file exists in `media` directory. */
            var file_path = path.join(self._mediaPath, uri_info.pathname);
            if (abFiles.file_Exists(file_path)) {
                response.writeHead(200, {
                        'Content-Type': mime.lookup(file_path) });
                response.end(fs.readFileSync(file_path), 'binary');
                return;
            }

            self._parseRequest(response, uri_info);
        });

        server.listen('8080', function() {
            abLog.success('Listening...');
        });
    },

    _getHostname: function()
    {
        var ifaces = os.networkInterfaces();

        for (var ifname in ifaces) {
            for (var i in ifaces[ifname]) {
                var iface = ifaces[ifname][i];

                if ('IPv4' !== iface.family || iface.internal !== false) {
                    // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                    continue;
                }

                console.log('Found interface:', ifname, iface.address);

                return iface.address;
            }
        }

        throw new Error('Cannot determine host.');
    },

    _errorToHtml: function(err)
    {
        var stack_array = err.stack.split('\n');

        var html = '<strong>' + stack_array[0] + '</strong>';

        html += '<ul>';
        for (var i = 1; i < stack_array.length; i++) {
            html += '<li>' + stack_array[i].replace('(', '(<strong>')
                    .replace(')', '</strong>)') + '</li>';
        }
        html += '</ul>';

        return html;
    },

    _execTest: function(response, test)
    {
        var request_fn = null;
        if (test.method === 'post')
            request_fn = request.post;
        else {
            this._output_Errors(response, ['Unknown `method`.']);
            return;
        }

        var uri = this._hostname + '/' + test.uri;
        abLog.log('Testing `%s`...', uri);

        var r = request_fn({
            jar: true,
            uri: this._hostname + '/' + test.uri
        });

        if (test.fields !== null)
            r.form(test.fields);

        var self = this;
        r.on('error', function(error) {
            self._output_Errors(response, [error]);
        });

        r.on('response', function(r_response) {
            response.writeHead(r_response.statusCode,
                    { 'Content-Type': r_response.headers['content-type'] })

            r_response.on('data', function(data) {
                response.write(data);
            });

            r_response.on('end', function(data) {
                response.end(data);
            });
        });
    },

    _output_Errors: function(response, errors)
    {
        var html = '<strong>Errors:</strong>';
        html += '<ul>';
        for (var i = 0; i < errors.length; i++)
            html += '<li>' + errors[i] + '</li>';
        html += '</ul>';

        this._output_Html(response, html, 404);
    },

    _output_Html: function(response, html, code)
    {
        code = typeof code === 'undefined' ? 200 : code;

        var page = '<html><head></head><body>' + html + '</body></html>';

        response.writeHead(code, { 'Content-Type': 'text/html' });
        response.write(page);
        response.end();
    },

    _parseRequest: function(response, uri_info)
    {
        var uri = uri_info.pathname;
        if (uri[uri.length - 1] === '/')
            uri = uri.substring(0, uri.length - 1);

        var test_path = path.resolve(path.join(this._testsDir, uri) + '.js');

        if (!abFiles.file_Exists(test_path)) {
            response.writeHead(404, { 'Content-Type': 'text/html' });
            response.end('Test not found');
            return;
        }

        var r_test_path = require.resolve(test_path);
        if (r_test_path in require.cache)
            delete require.cache[r_test_path];

        try {
            var test = require(test_path);

            var parse_errors = this._parseTest(test);
            if (parse_errors.length > 0) {
                this._output_Errors(response, parse_errors);
                return;
            }

            this._execTest(response, test);
        } catch (err) {
            var errors = [ this._errorToHtml(err) ];
            this._output_Errors(response, errors);
        }
    },

    _parseTest: function(test)
    {
        var errors = [];

        for (var i = 0; i < ApiTester._TestArgs_Required.length; i++) {
            var arg_name = ApiTester._TestArgs_Required[i];

            if (!(arg_name in test))
                errors.push('`' + arg_name + '` not set.');
        }

        for (var arg_name in test) {
            if (ApiTester._TestArgs_Required.indexOf(arg_name) === -1 &&
                    !(arg_name in ApiTester._TestArgs_Optional))
                errors.push('Unknow arg `' + arg_name + '`.');
        }

        for (arg_name in ApiTester._TestArgs_Optional) {
            if (!(arg_name in test))
                test[arg_name] = ApiTester._TestArgs_Optional[arg_name];
        }

        return errors;
    }

};
ApiTester.Class.prototype = ApiTester;
module.exports = ApiTester;
