var WeatherItem = require('../../public/js/weather_item').default;

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var fetchMock = require('fetch-mock');
var fs = require('fs');
var jsdom = require('jsdom');
var path = require('path');


chai.use(chaiAsPromised);
const htmlContent = fs.readFileSync(path.resolve(__dirname, '../../public/index.html'));
const weatherDataOslo = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/raw_weather_response.json')));
const weatherDataHelsinki = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/raw_weather_response_1.json')));


class MockGeolocationPosition {
    constructor(latitude, longitude) {
        this.coords = {
            latitude: latitude,
            longitude: longitude
        };
    }
}

mockNavigator = {
    geolocation: {
        getCurrentPosition: (successCallback, _) => {
            var location = new MockGeolocationPosition(60.18, 24.93);
            successCallback(location).then(() => {});
        }
    }
}


describe('Frontend General UI', () => {
    const favouritesUrl = /http\:\/\/localhost\:3000\/favourites.*/;
    var weather = null;

    beforeEach(() => {
        let dom = new jsdom.JSDOM(htmlContent, {
            contentType: "text/html",
            includeNodeLocations: true
        });

        global.window = dom.window;
        global.document = dom.window.document;
        global.GeolocationPosition = MockGeolocationPosition;
        global.navigator = mockNavigator;

        weather = require('../../public/js/weather');
        document.removeEventListener("DOMContentLoaded", weather.initPage);

        fetchMock.get(
            /http\:\/\/localhost\:3000\/weather\/city\?q=(O|o)slo/,
            weatherDataOslo
        );

        fetchMock.get(
            'http://localhost:3000/weather/coordinates?lat=60.18&long=24.93',
            weatherDataHelsinki
        );

        fetchMock.get(
            /http\:\/\/localhost\:3000\/weather\/city\?q=(H|h)elsinki/,
            weatherDataHelsinki
        );
    });

    describe('Weather Here', () => {
        it('should init weather here', async () => {
            weather.initWeatherHere()

            await new Promise(r => setTimeout(r, 10));

            let here = document.querySelector('header[id="_here"] h2[name="city"]');
            chai.expect(here).to.not.be.null;
            chai.expect(here.textContent).to.be.equal('Helsinki');
        });

        it('should load weather here by coords', async () => {
            let coords = new MockGeolocationPosition(60.18, 24.93);

            await weather.loadWeatherHere(coords);
            await new Promise(r => setTimeout(r, 10));

            let here = document.querySelector('header[id="_here"] h2[name="city"]');
            chai.expect(here).to.not.be.null;
            chai.expect(here.textContent).to.be.equal('Helsinki');
        });

        it('should load weather here by name', async () => {
            await weather.loadWeatherHere('oslo');
            await new Promise(r => setTimeout(r, 10));

            let here = document.querySelector('header[id="_here"] h2[name="city"]');
            chai.expect(here).to.not.be.null;
            chai.expect(here.textContent).to.be.equal('Oslo');
        });

        it('should default to Oslo on geolocation denial', async () => {
            var err = { code: 1, message: '' };
            
            await weather.loadWeatherHereError(err);
            await new Promise(r => setTimeout(r, 10));

            let here = document.querySelector('header[id="_here"] h2[name="city"]');
            chai.expect(here).to.not.be.null;
            chai.expect(here.textContent).to.be.equal('Oslo');
        });

        it('should print unhandled geolocation error', async () => {
            var err = { code: 2, message: 'haha you failed' };

            await weather.loadWeatherHereError(err);
            await new Promise(r => setTimeout(r, 10));

            let here = document.querySelector('h3[name="error"]');
            chai.expect(here).to.not.be.null;
            chai.expect(here.textContent).to.be.equal('haha you failed');
        });
    });

    describe('Bookmarks', () => {
        beforeEach(() => {
            var mockEvent = {
                preventDefault: () => {},
                target: {
                    elements: {
                        bookmarkLocation: {
                            value: "Oslo"
                        }
                    }
                }
            };
            global.event = mockEvent;

            fetchMock.post(
                favouritesUrl,
                {}
            );

            fetchMock.delete(
                favouritesUrl,
                {}
            );
        });

        it('should add new bookmark', async () => {
            await weather.addWeatherBookmark();
            await new Promise(r => setTimeout(r, 10));

            let bookmark = document.querySelector('li[id="oslo"]');
            chai.expect(bookmark).to.not.be.null;

            chai.expect(bookmark.querySelector('h3[name="city"]').textContent).to.be.equal('Oslo');
            chai.expect(weather.secondaryWeatherLocations).to.contain('oslo');

            chai.expect(fetchMock.called(favouritesUrl)).to.be.true;

            let lastBody = fetchMock.lastOptions(favouritesUrl).body;
            chai.expect(lastBody).to.be.equal('{"name":"oslo"}');
        });

        it('should alert on empty value', (done) => {
            global.event.target.elements.bookmarkLocation.value = "";
            global.window.alert = (message) => {
                chai.expect(message).to.be.equal("Укажите местоположение!");
                done();
            };

            weather.addWeatherBookmark().then(() => {});
        });

        it('should alert on duplicate value', (done) => {
            global.window.alert = (message) => {
                chai.expect(message).to.be.equal("oslo already exists!");
                done();
            };

            weather.addWeatherBookmark().then(() => {});
            weather.addWeatherBookmark().then(() => {});
        });

        it('should delete bookmark', async () => {
            global.event.target.elements.bookmarkLocation.value = "Helsinki";

            await weather.addWeatherBookmark();
            await new Promise(r => setTimeout(r, 10));

            let bookmark = document.querySelector('li[id="helsinki"]');
            chai.expect(bookmark).to.not.be.null;
            chai.expect(weather.secondaryWeatherLocations).to.contain('helsinki');

            weather.deleteWeatherBookmark('helsinki');

            bookmark = document.querySelector('li[id="helsinki"]');
            chai.expect(bookmark).to.be.null;
            chai.expect(weather.secondaryWeatherLocations).to.not.contain('helsinki');

            chai.expect(fetchMock.lastCall()[0]).to.be.equal('http://localhost:3000/favourites?name=helsinki');
            chai.expect(fetchMock.lastCall()[1].method).to.be.equal('DELETE');
        });

        it('should init bookmarks', (done) => {
            weather.secondaryWeatherLocations.add('oslo');
            weather.secondaryWeatherLocations.add('helsinki');
            weather.initWeatherBookmarks();

            setTimeout(() => {
                let bookmark = document.querySelector('li[id="oslo"]');
                chai.expect(bookmark).to.not.be.null;
                bookmark = document.querySelector('li[id="helsinki"]');
                chai.expect(bookmark).to.not.be.null;

                done();
            }, 10);
        });

        afterEach(() => {
            global.event = undefined;
        });
    });

    describe('Page Initialization', () => {
        beforeEach(() => {
            fetchMock.get(
                favouritesUrl,
                [{ name: 'oslo' }, { name: 'helsinki' }]
            );
        });

        it('should initialize the page', async () => {
            await weather.initPage();
            await new Promise(r => setTimeout(r, 10));

            let here = document.querySelector('header[id="_here"] h2[name="city"]');
            chai.expect(here).to.not.be.null;
            chai.expect(here.textContent).to.be.equal('Helsinki');

            let bookmark = document.querySelector('li[id="oslo"]');
            chai.expect(bookmark).to.not.be.null;
            bookmark = document.querySelector('li[id="helsinki"]');
            chai.expect(bookmark).to.not.be.null;
        });
    });

    afterEach(() => {
        global.window = undefined;
        global.document = undefined;
        global.GeolocationPosition = undefined;
        global.navigator = undefined;

        weather = null;

        fetchMock.restore();
    });
});
