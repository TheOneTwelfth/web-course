var app = require('../app');


app.server.get('/favourites', (_req, res) => {
    app.db.all('SELECT name FROM favourites', (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500);
            return;
        }

        res.json(rows);
    })
});

app.server.post('/favourites', (req, res) => {
    if (!req.body.name) {
        res.status(400).send("Please specify bookmark name");
        return;
    }

    let stmt = app.db.prepare('INSERT INTO favourites VALUES (?)');

    stmt.run(req.body.name, (err) => {
        if (err) {
            if (err.code != 'SQLITE_CONSTRAINT') {
                console.error(err);
                res.status(500);
                return;
            }

            res.status(409).send("Bookmark already exists!");
            return;
        }

        res.status(200).json({'status': 'ok'});
    });
});

app.server.delete('/favourites', (req, res) => {
    if (!req.query.name) {
        res.status(400).send("Please specify location name");
        return;
    }

    let stmt = app.db.prepare('DELETE FROM favourites WHERE name=?');

    stmt.run(req.query.name, (err) => {
        if (err) {
            console.error(err);
            res.status(500);
            return;
        }

        res.status(200).json({'status': 'ok'});
    });
});
