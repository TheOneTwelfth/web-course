import constructNodeId from './utils.js'
import WEATHER_API_KEY from './settings.js'


export default class WeatherItem {
    constructor(templateId, location) {
        this.templateId = templateId;
        this.location = location;
    }

    async render() {
        await this.fetchWeather();
        return this.build();
    }

    async fetchWeather() {
        let resp = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${this.location}`);
        this.weatherData = await resp.json();
    }

    build() {
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

        this.nodeId = constructNodeId(this.weatherData.location.name);
        weatherTemplate.querySelector('div[name="container"]').id = this.nodeId;

        return document.importNode(weatherTemplate, true);
    }

    buildLoader() {
        let weatherTemplate = document.querySelector("#weatherLoader").content; 
        return document.importNode(weatherTemplate, true);
    }

}
