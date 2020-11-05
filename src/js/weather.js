import { constructNodeId } from './utils.js'
import WeatherItem from './weather_item.js'


const DEFAULT_CITY = "Oslo";


var secondaryWeatherItems = new Map();
var secondaryWeatherLocations = new Set();


function commitWeatherLocations() {
    localStorage.setItem("secondaryWeatherLocations", JSON.stringify(Array.from(secondaryWeatherLocations)));
}


function initWeatherHere() {
    let wrapNode = document.querySelector(".weather__primary__wrap");
    wrapNode.textContent = "";
    wrapNode.appendChild(getWeatherLoader());
    navigator.geolocation.getCurrentPosition(loadWeatherHere, loadWeatherHereError);
}


async function loadWeatherHere(location) {
    if (location instanceof GeolocationPosition) {
        var coords = `${location.coords.latitude},${location.coords.longitude}`;
    }
    else {
        var coords = location;
    }

    let primaryWeatherItem = new WeatherItem("#weatherPrimaryTemplate", coords, "_here");
    let primaryWeather = primaryWeatherItem.build();

    let wrapNode = document.querySelector(".weather__primary__wrap");
    wrapNode.textContent = "";
    wrapNode.appendChild(primaryWeather);
}


async function loadWeatherHereError(error) {
    if (error.code == 1) {
        await loadWeatherHere(DEFAULT_CITY);
        return;
    }

    let errorTemplate = document.querySelector("#weatherPrimaryTemplateError").content;
    errorTemplate.querySelector('h3[name="error"]').textContent = error.message;
    let clone = document.importNode(errorTemplate, true);

    let parentNode = document.querySelector(".weather__primary__wrap");
    parentNode.textContent = "";
    parentNode.appendChild(clone);
}


async function addWeatherBookmark() {
    event.preventDefault();

    let bookmarkInput = document.querySelector("#addBookmark");
    let bookmarkLocation = bookmarkInput.value;
    bookmarkInput.value = "";

    if (bookmarkLocation == "") {
        window.alert("Укажите местоположение!");
        return;
    }

    let newWeatherNodeId = constructNodeId(bookmarkLocation);
    if (secondaryWeatherLocations.has(newWeatherNodeId)) {
        alert(`${newWeatherNodeId} already exists!`);
        return;
    }

    let newWeatherItem = new WeatherItem("#weatherSecondaryTemplate", bookmarkLocation, newWeatherNodeId);
    secondaryWeatherItems.set(newWeatherNodeId, newWeatherItem);

    secondaryWeatherLocations.add(newWeatherNodeId);
    commitWeatherLocations();

    rebuildSecondaryWeather();
}


export function deleteWeatherBookmark(nodeId) {
    secondaryWeatherItems.delete(nodeId);
    secondaryWeatherLocations.delete(nodeId);
    commitWeatherLocations();

    rebuildSecondaryWeather();
}


function getWeatherLoader() {
    let weatherTemplate = document.querySelector("#weatherPrimaryTemplateLoader").content;
    return document.importNode(weatherTemplate, true);
}


function rebuildSecondaryWeather() {
    let clearfixTemplate = document.querySelector("#weatherClearfix").content;

    let wrapNode = document.querySelector(".weather__secondary__wrap");
    wrapNode.textContent = "";

    for (var [id, item] of secondaryWeatherItems) {
        let node = item.build();
        wrapNode.appendChild(node);
    }
}


async function initWeatherBookmarks() {
    for (var weatherId of secondaryWeatherLocations) {
        let weatherBookmark = new WeatherItem("#weatherSecondaryTemplate", weatherId);
        secondaryWeatherItems.set(weatherId, weatherBookmark);
    }
    rebuildSecondaryWeather();
}


async function initPage() {
    let localStorageLocations = localStorage.getItem("secondaryWeatherLocations");
    if (localStorageLocations != null) {
        secondaryWeatherLocations = new Set(JSON.parse(localStorageLocations));
    }
    initWeatherHere();
    await initWeatherBookmarks();
}


document.addEventListener("DOMContentLoaded", initPage);
document.querySelector("#addBookmarkBtn").addEventListener("click", addWeatherBookmark);
document.querySelector("#updateLocation").addEventListener("click", initWeatherHere);
