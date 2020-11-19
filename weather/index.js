var app = require('./app');

require('./api/favourites');
require('./api/weather');

app.server.listen(3000, () => {
    console.log("Server running on port 3000");
});
