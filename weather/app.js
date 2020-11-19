var express = require('express');
var app = express();

var sqlite = require('sqlite3');
var db = new sqlite.Database('./db.sqlite');

app.use(express.static('./public'));
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
