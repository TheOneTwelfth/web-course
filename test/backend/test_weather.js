var app = require('../../weather/app');
var settings = require('../../weather/settings');
require('../../weather/api/weather');

var chai = require('chai');
var chaiHttp = require('chai-http');
var fs = require('fs');
var path = require('path');
var request = require('request');
var rewire = require('rewire');
var sinon = require('sinon');

var weatherModule = rewire('../../weather/api/weather');
var parseWeatherData = weatherModule.__get__('parseWeatherData');


chai.use(chaiHttp);
settings.WEATHER_API_KEY = 'testkey';

const weatherData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/raw_weather_data.json')));

describe('Weather API', () => {
    beforeEach(() => {
        this.getStub = sinon.stub(request, 'get');
    });

    describe('Parse Weather Data', () => {
        it('should correctly parse weather data', () => {
            let parsedData = parseWeatherData(weatherData);

            chai.expect(parsedData.name).to.be.equal('Moscow');
            chai.expect(parsedData.icon).to.be.equal('https://cdn.weatherapi.com/weather/128x128/night/116.png');
            chai.expect(parsedData.temperature).to.be.equal('-5°C');

            chai.expect(parsedData.details.wind).to.be.equal('19.1 kph ESE');
            chai.expect(parsedData.details.clouds).to.be.equal('Partly cloudy');
            chai.expect(parsedData.details.pressure).to.be.equal('1030 mb');
            chai.expect(parsedData.details.humidity).to.be.equal('73%');
            chai.expect(parsedData.details.coords).to.be.equal('[55.75, 37.62]');
        });
    });

    describe('GET /weather/city', () => {
        it('should fetch correct weather data', async () => {
            this.getStub.yields(
                null,
                { statusCode: 200, headers: { 'content-type': 'application/json' } },
                weatherData
            );

            let res = await chai
                .request(app.server)
                .get('/weather/city?q=Moscow');
            
            chai.expect(res.status).to.equal(200);
            chai.expect(res.body.name).to.equal('Moscow');
        });

        it('should fetch weather data without query and get 400', async () => {
            let res = await chai
                .request(app.server)
                .get('/weather/city');
            
            chai.expect(res.status).to.equal(400);
            chai.expect(res.text).to.equal("Please specify location name");
        });

        it('should fetch weather data with invalid location and get 404', async () => {
            this.getStub.yields(
                null,
                { statusCode: 400 },
            );

            let res = await chai
                .request(app.server)
                .get('/weather/city?q=fkgmsgksreptjpitj');

            chai.expect(res.status).to.equal(404);
            chai.expect(res.text).to.equal("Invalid location: fkgmsgksreptjpitj!");
        });
    });

    describe('GET /weather/coordinates', () => {
        it('should fetch correct weather data by coords', async () => {
            this.getStub.yields(
                null,
                { statusCode: 200, headers: { 'content-type': 'application/json' } },
                weatherData
            );

            let res = await chai
                .request(app.server)
                .get('/weather/coordinates?lat=55.75&long=37.62');
            
            chai.expect(res.status).to.equal(200);
            chai.expect(res.body.name).to.equal('Moscow');
        });

        it('should fetch weather data without coords and get 400', async () => {
            let res = await chai
                .request(app.server)
                .get('/weather/coordinates');
            
            chai.expect(res.status).to.equal(400);
            chai.expect(res.text).to.equal("Please specify both latitude and longitude");
        });

        it('should fetch weather data with only one coord and get 400', async () => {
            let res = await chai
                .request(app.server)
                .get('/weather/coordinates?lat=5');
            chai.expect(res.status).to.equal(400);
            chai.expect(res.text).to.equal("Please specify both latitude and longitude");

            res = await chai
                .request(app.server)
                .get('/weather/coordinates?long=5');
            chai.expect(res.status).to.equal(400);
            chai.expect(res.text).to.equal("Please specify both latitude and longitude");
        });
    });

    afterEach(() => {
        sinon.restore();
    });
});
