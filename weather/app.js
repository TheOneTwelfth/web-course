var bodyParser = require('body-parser');
var express = require('express');
var sqlite3 = require('sqlite3');

var settings = require('./settings');


var server = express();
server.use(express.static('./public'));

server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());

var db = new sqlite3.Database(settings.DB_SOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    }

    console.log(`Established SQLite connection to ${settings.DB_SOURCE}`);
    db.run(`
        CREATE TABLE IF NOT EXISTS favourites(
            name TEXT PRIMARY KEY
        );
    `);
});

exports.db = db;
exports.server = server;
