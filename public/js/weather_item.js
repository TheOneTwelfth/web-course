import { constructNodeId, WeatherError } from './utils.js'
import WEATHER_API_KEY from './settings.js'


export default class WeatherItem {
    constructor(templateId, location, customId = null) {
        this.templateId = templateId;
        this.location = location;
        this.customId = customId;

        this.weatherData = null;
    }

    async fetchWeather() {
        try {
            var resp = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${this.location}`);
        } catch (e) {
            if (!(e instanceof TypeError)) {
                throw e;
            }
            throw new WeatherError(e.message);
        }

        switch(resp.status) {
            case 200:
                this.weatherData = await resp.json();
                return true;
            case 400:
                throw new WeatherError(`Invalid location: ${this.location}!`);
            default:
                throw new WeatherError("API error occured!");
        }
    }

    build() {
        return this.weatherData ? this.fillNode() : this.loadNode();
    }

    fillNode() {
        let weatherTemplate = document.querySelector(this.templateId).content;

        weatherTemplate.querySelector('*[name="city"]').textContent = this.weatherData.location.name;
        weatherTemplate.querySelector('img[name="icon"]').src = 
        `https://${this.weatherData.current.condition.icon.replace("64x64", "128x128")}`;
        weatherTemplate.querySelector('span[name="temperature"]').textContent = `${this.weatherData.current.temp_c}°C`;

        weatherTemplate.querySelector('li[name="wind"] span:nth-child(2)').textContent = 
            `${this.weatherData.current.wind_kph} kph ${this.weatherData.current.wind_dir}`;
        weatherTemplate.querySelector('li[name="clouds"] span:nth-child(2)').textContent = this.weatherData.current.condition.text;
        weatherTemplate.querySelector('li[name="pressure"] span:nth-child(2)').textContent = 
            `${this.weatherData.current.pressure_mb} mb`;
        weatherTemplate.querySelector('li[name="humidity"] span:nth-child(2)').textContent = 
            `${this.weatherData.current.humidity}%`;
        weatherTemplate.querySelector('li[name="coords"] span:nth-child(2)').textContent = 
            `[${this.weatherData.location.lat}, ${this.weatherData.location.lon}]`;

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
