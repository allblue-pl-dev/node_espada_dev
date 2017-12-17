'use strict';

const mysql = require('mysql');


class Database
{

    constructor(connection_info)
    {
        this._db = null;
        this._connectionInfo = connection_info;
    }

    connect()
    {
        if (this._db !== null)
            this._db.disconnect();

        this._db = mysql.createConnection(this._connectionInfo);
        this._db.connect();
    }

    disconnect()
    {
        this._db.end();
        this._db = null;
    }

    query(query, result_fn)
    {
        return new Promise((resolve, reject) => {
            try {
                console.log('Running query...');

                this._db.query(query, function(error, results, fields) {
                    if (error)
                        reject(error);

                    result_fn(results);

                    resolve();
                });
            } catch (err) {
                reject(err);
            }
        });
    }

};
module.exports = Database;
