var utils = require('../../public/js/utils');
var WeatherItem = require('../../public/js/weather_item').default;

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var fetch = require('node-fetch');
var fetchMock = require('fetch-mock');
var fs = require('fs');
var jsdom = require('jsdom');
var path = require('path');


chai.use(chaiAsPromised);
const htmlContent = fs.readFileSync(path.resolve(__dirname, '../../public/index.html'));

describe('Frontend Weather Item', () => {
    describe('Fetch Weather', () => {
        it('should correctly fetch weather data', async () => {
            let weatherData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/raw_weather_response.json')));
            fetchMock.get(
                'http://localhost:3000/weather/city?q=oslo',
                weatherData
            );

            let weatherItem = new WeatherItem("#weatherSecondaryTemplate", "oslo", "oslo");

            let fetchStatus = await weatherItem.fetchWeather();
            chai.expect(fetchStatus).to.be.equal(true);
            chai.expect(weatherItem.weatherData.name).to.be.equal("Oslo");
        });

        it('should throw WeatherError', async () => {
            fetchMock.get(
                'http://localhost:3000/weather/city?q=oslo', 
                new fetch.Response("Invalid location: oslo!", { status: 404 })
            );

            let weatherItem = new WeatherItem("#weatherSecondaryTemplate", "oslo", "oslo");
            chai.expect(weatherItem.fetchWeather())
                .to.eventually.be.rejectedWith(utils.WeatherError, "Invalid location: oslo!");
        });

        it('should throw WeatherError on network error', async () => {
            fetchMock.get(
                'http://localhost:3000/weather/city?q=oslo', 
                null, { throws: new TypeError("[Errno 111] Connection refused") }
            );

            let weatherItem = new WeatherItem("#weatherSecondaryTemplate", "oslo", "oslo");
            chai.expect(weatherItem.fetchWeather())
                .to.eventually.be.rejectedWith(TypeError, "[Errno 111] Connection refused");
        });

        afterEach(() => { fetchMock.restore(); });
    });

    describe('Node Operations', () => {
        beforeEach(() => {
            let dom = new jsdom.JSDOM(htmlContent, {
                contentType: "text/html",
                includeNodeLocations: true
            });

            global.document = dom.window.document;
        });

        it('should construct valid node', () => {
            let weatherItem = new WeatherItem("#weatherSecondaryTemplate", "oslo");
            weatherItem.weatherData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/raw_weather_response.json')));
            weatherItem.nodeId = "testNode";

            let created = weatherItem.fillNode();
            chai.expect(created).to.not.be.null;

            chai.expect(created.querySelector('*[name="city"]').textContent).to.be.equal("Oslo");
            chai.expect(created.querySelector('li[name="wind"] span:nth-child(2)').textContent).to.be.equal("13 kph E");
        });

        it('should construct error node', () => {
            let weatherItem = new WeatherItem("#weatherSecondaryTemplate", "oslo");

            let created = weatherItem.fillNodeError();
            chai.expect(created).to.not.be.null;

            chai.expect(created.querySelector('*[name="city"]').textContent).to.be.equal("oslo");
        });

        it('should load valid node', async () => {
            let weatherData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/raw_weather_response.json')));
            fetchMock.get(
                'http://localhost:3000/weather/city?q=oslo',
                weatherData,
                { delay: 10 }
            );
            let wrapNode = global.document.querySelector(".weather__secondary__wrap");

            let weatherItem = new WeatherItem("#weatherSecondaryTemplate", "oslo");
            let loader = weatherItem.loadNode();

            chai.expect(loader.querySelector('*[name="container"]').id).to.be.equal('oslo');
            chai.expect(loader.querySelector('img')).to.not.be.null;

            wrapNode.appendChild(loader);
            await new Promise(r => setTimeout(r, 15));

            let loadedNode = global.document.querySelector("#oslo");
            chai.expect(loadedNode.querySelector('li[name="wind"] span:nth-child(2)').textContent).to.be.equal("13 kph E");

            fetchMock.restore();
        });

        it('should load error node', async () => {
            fetchMock.get(
                'http://localhost:3000/weather/city?q=oslo', 
                new fetch.Response("Invalid location: oslo!", { status: 404 }),
                { delay: 10 }
            );

            let wrapNode = global.document.querySelector(".weather__secondary__wrap");

            let weatherItem = new WeatherItem("#weatherSecondaryTemplate", "oslo");
            let loader = weatherItem.loadNode();

            wrapNode.appendChild(loader);
            await new Promise(r => setTimeout(r, 15));

            let loadedNode = global.document.querySelector('*[name="container"]');
            chai.expect(loadedNode.querySelector('h3[name="error"]').textContent).to.be.equal("Invalid location: oslo!");

            fetchMock.restore();
        });

        afterEach(() => {
            global.document = undefined;
        });
    });
});
