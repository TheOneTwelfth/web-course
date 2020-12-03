var app = require('../../weather/app');
require('../../weather/api/favourites');

var chai = require('chai');
var chaiHttp = require('chai-http');


chai.use(chaiHttp);

describe('Favourites API', () => {
    describe('GET /favourites', () => {
        it('should GET all favourites', async () => {
            let res = await chai
                .request(app.server)
                .get('/favourites');

            chai.expect(res.status).to.equal(200);
            chai.expect(res.body).to.be.a('array');
            chai.expect(res.body.length).to.be.equal(0);
        });
    });

    describe('POST /favourites', () => {
        it('should POST new favourite', async () => {
            let res = await chai
                .request(app.server)
                .post('/favourites')
                .send({name: 'Moscow'});
            chai.expect(res.status).to.equal(200);

            res = await chai
                .request(app.server)
                .get('/favourites');
            chai.expect(res.status).to.equal(200);
            chai.expect(res.body[0].name).to.be.equal('Moscow');
        });

        it('should POST invalid favourite and get 400', async () => {
            let res = await chai
                .request(app.server)
                .post('/favourites')
                .send({});

            chai.expect(res.status).to.equal(400);
            chai.expect(res.text).to.equal("Please specify bookmark name");
        });

        it('should POST duplicate favourite and get 409', async () => {
            let res = await chai
                .request(app.server)
                .post('/favourites')
                .send({name: 'Oslo'});
            chai.expect(res.status).to.equal(200);

            res = await chai
                .request(app.server)
                .post('/favourites')
                .send({name: 'Oslo'});
            chai.expect(res.status).to.equal(409);
            chai.expect(res.text).to.equal("Bookmark already exists!");
        });
    });

    describe('DELETE /favourites', () => {
        it('should DELETE favourite', async () => {
            let res = await chai
                .request(app.server)
                .post('/favourites')
                .send({name: 'Helsinki'});
            chai.expect(res.status).to.equal(200);

            res = await chai
                .request(app.server)
                .delete('/favourites?name=Helsinki');
            chai.expect(res.status).to.equal(200);

            res = await chai
                .request(app.server)
                .get('/favourites');
            chai.expect(res.status).to.equal(200);
            chai.expect(res.body.length).to.be.equal(0);
        });

        it('should DELETE invalid favourite and get 400', async() => {
            res = await chai
                .request(app.server)
                .delete('/favourites');

            chai.expect(res.status).to.equal(400);
            chai.expect(res.text).to.equal("Please specify location name");
        });
    });

    afterEach((done) => {
        app.db.run("DELETE FROM favourites", () => {
            done();
        });
    });
});
