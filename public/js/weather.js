import { constructNodeId } from './utils.js'
import WeatherItem from './weather_item.js'
import BACKEND_URL from './settings.js'


const DEFAULT_CITY = "Oslo";


var secondaryWeatherItems = new Map();
var secondaryWeatherLocations = new Set();


function initWeatherHere() {
    let wrapNode = document.querySelector(".weather__primary__wrap");
    wrapNode.textContent = "";
    wrapNode.appendChild(getWeatherLoader());
    navigator.geolocation.getCurrentPosition(loadWeatherHere, loadWeatherHereError);
}


async function loadWeatherHere(location) {
    if (location instanceof GeolocationPosition) {
        var coords = {
            'lat': location.coords.latitude,
            'long': location.coords.longitude
        };
        var fetchCoords = true;
    }
    else {
        var coords = location;
        var fetchCoords = false;
    }

    let primaryWeatherItem = new WeatherItem("#weatherPrimaryTemplate", coords, "_here", fetchCoords);
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

    let bookmarkInput = event.target.elements.bookmarkLocation;
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
    await fetch(
        `${BACKEND_URL}/favourites`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({'name': newWeatherNodeId})
        }
    )

    rebuildSecondaryWeather();
}


export function deleteWeatherBookmark(nodeId) {
    secondaryWeatherItems.delete(nodeId);
    secondaryWeatherLocations.delete(nodeId);

    fetch(`${BACKEND_URL}/favourites?name=${nodeId}`, {method: 'DELETE'})
        .then(() => {});

    rebuildSecondaryWeather();
}


function getWeatherLoader() {
    let weatherTemplate = document.querySelector("#weatherPrimaryTemplateLoader").content;
    return document.importNode(weatherTemplate, true);
}


function rebuildSecondaryWeather() {
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
    let favouritesResp = await fetch(`${BACKEND_URL}/favourites`);
    let secondaryWeatherLocationsList = await favouritesResp.json();
    secondaryWeatherLocations = new Set(secondaryWeatherLocationsList.map(({ name }) => name));

    initWeatherHere();
    await initWeatherBookmarks();
}


document.addEventListener("DOMContentLoaded", initPage);
document.querySelector("#addBookmarkForm").addEventListener("submit", addWeatherBookmark);
document.querySelector("#updateLocation").addEventListener("click", initWeatherHere);
