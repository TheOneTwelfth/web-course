import { constructNodeId, WeatherError } from './utils.js'
import BACKEND_URL from './settings.js'


export default class WeatherItem {
    constructor(templateId, location, customId = null, fetchCoords = false) {
        this.templateId = templateId;
        this.location = location;
        this.customId = customId;
        this.fetchCoords = fetchCoords;

        this.weatherData = null;
    }

    async fetchWeather() {
        try {
            if (this.fetchCoords) {
                var resp = await fetch(`${BACKEND_URL}/weather/coordinates?lat=${this.location.lat}&long=${this.location.long}`);
            }
            else {
                var resp = await fetch(`${BACKEND_URL}/weather/city?q=${this.location}`);
            }
        } catch (e) {
            if (!(e instanceof TypeError)) {
                throw e;
            }
            throw new WeatherError(e.message);
        }

        if (resp.status == 200) {
            this.weatherData = await resp.json();
            return true;
        }

        throw new WeatherError(await resp.text());
    }

    build() {
        return this.weatherData ? this.fillNode() : this.loadNode();
    }

    fillNode() {
        let weatherTemplate = document.querySelector(this.templateId).content;

        weatherTemplate.querySelector('*[name="city"]').textContent = this.weatherData.name;
        weatherTemplate.querySelector('img[name="icon"]').src = this.weatherData.icon;
        weatherTemplate.querySelector('span[name="temperature"]').textContent = this.weatherData.temperature;

        weatherTemplate.querySelector('li[name="wind"] span:nth-child(2)').textContent = this.weatherData.details.wind;
        weatherTemplate.querySelector('li[name="clouds"] span:nth-child(2)').textContent = this.weatherData.details.clouds;
        weatherTemplate.querySelector('li[name="pressure"] span:nth-child(2)').textContent = this.weatherData.details.pressure;
        weatherTemplate.querySelector('li[name="humidity"] span:nth-child(2)').textContent = this.weatherData.details.humidity;
        weatherTemplate.querySelector('li[name="coords"] span:nth-child(2)').textContent = this.weatherData.details.coords;

        weatherTemplate.querySelector('*[name="container"]').id = this.nodeId;

        let clone = document.importNode(weatherTemplate, true);
        let close_btn = clone.querySelector(".weather__secondary__btn");
        if (close_btn) {
            var item = this;
            close_btn.addEventListener("click", function () {
                item.deleteNode();
            }, false);
        }

        return clone;
    }

    fillNodeError(errorMessage) {
        let errorTemplate = document.querySelector(`${this.templateId}Error`).content;

        try {
            errorTemplate.querySelector('*[name="city"]').textContent = this.location;
        } catch (e) {}
        
        errorTemplate.querySelector('h3[name="error"]').textContent = errorMessage;

        let clone = document.importNode(errorTemplate, true);
        let close_btn = clone.querySelector(".weather__secondary__btn");
        if (close_btn) {
            var item = this;
            close_btn.addEventListener("click", function () {
                item.deleteNode();
            }, false);
        }

        return clone;
    }

    loadNode() {
        let weatherTemplate = document.querySelector(`${this.templateId}Loader`).content;

        let rawNodeId = this.customId ? this.customId : this.location;
        this.nodeId = constructNodeId(rawNodeId);
        weatherTemplate.querySelector('*[name="container"]').id = this.nodeId;

        this.fetchWeather()
            .then(() => {
                let newNode = this.fillNode();
                let oldNode = document.querySelector(`[id='${this.nodeId}']`);
                oldNode.parentNode.replaceChild(newNode, oldNode);
            })
            .catch((e) => {
                console.log(e);
                if (e instanceof WeatherError) {
                    let newNode = this.fillNodeError(e.message);
                    let oldNode = document.querySelector(`[id='${this.nodeId}']`);
                    oldNode.parentNode.replaceChild(newNode, oldNode);
                }
                else {
                    throw e;
                }
            });

        return document.importNode(weatherTemplate, true);
    }

    deleteNode() {
        import('./weather.js')
            .then((weatherModule) => {
                weatherModule.deleteWeatherBookmark(this.nodeId);
            });
    }
}
