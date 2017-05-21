'use strict';

const mysql = require('mysql');

const _Database = {

    _ClearTypes: [ 'dev', 'prod' ],


    _db: null,
    _tables: null,

    _newQuery: function(query)
    { var $this = this;
        return new Promise(function(resolve, reject) {
            try {
                console.log('Running: ' + query);

                $this._db.query(query, function(err) {
                    if (err)
                        reject(err);

                    resolve();
                });
            } catch (err) {
                reject(err);
            }
        });
    },

    _runQueries: function(queries)
    { var $this = this;
        return new Promise(function(resolve, reject) {
            try {
                var promise = $this._newQuery(queries[0]);

                queries.forEach(function(q, i) {
                    if (i === 0)

                        return;
                    promise = promise.then(function() {
                        console.log('Done.');
                        return $this._newQuery(q);
                    }).catch(function(err) {
                        reject(err);
                    });
                });

                promise.then(function() {
                    console.log('Done');
                    resolve();
                }).catch(function(err) {
                    reject(err);
                });
            } catch(err) {
                reject(err);
            }
        });
    },


    Class: function(connection_info)
    {
        this._db = mysql.createConnection(connection_info);
        this._tables = [];
    },

    clear: function(clear_type)
    {
        if (_Database._ClearTypes.indexOf(clear_type) === -1) {
            throw new Error('Unknown `clear_type`. Available clear types: ' +
                    _Database._ClearTypes);
        }

        let where = '';
        let auto_increment = ' AUTO_INCREMENT = 1001';
        if (clear_type === 'dev')
            where = ' WHERE Id >= 1001';
        else if (clear_type === 'prod')
            where = ' WHERE Id >= 101';
        else if (clear_type === 'all')
            where = '';
        else
            throw new Exception('Unknown `clear_type`.');

        let queries = [];
        for (let i = 0; i < this._tables.length; i++) {
            // queries.push('DELETE FROM ' + this._tables[i] + where);
            queries.push('ALTER TABLE ' + this._tables[i] + auto_increment);
        }

        this._runQueries(queries)
            .catch(function(err) {
                console.log(err);
            });
    },

    tables: function(table_names)
    {
        this._tables = table_names;
        return this;
    }

};
_Database.Class.prototype = _Database;
module.exports = _Database;
