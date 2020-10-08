import constructNodeId from './utils.js'
import WeatherItem from './weather_item.js'


var secondaryWeatherItems = new Map();
var secondaryWeatherLocations = new Set();


function commitWeatherLocations() {
    localStorage.setItem("secondaryWeatherLocations", JSON.stringify(Array.from(secondaryWeatherLocations)));
}


function initWeatherHere() {
    navigator.geolocation.getCurrentPosition(loadWeatherHere);
}


async function loadWeatherHere(location) {
    let coords = `${location.coords.latitude},${location.coords.longitude}`;
    let primaryWeatherItem = new WeatherItem("#weatherPrimaryTemplate", coords);
    let primaryWeather = await primaryWeatherItem.render();
    document.querySelector(".weather__primary__wrap").appendChild(primaryWeather);
}


async function addWeatherBookmark() {
    let bookmarkLocation = document.querySelector("#addBookmark").value;

    if (bookmarkLocation == "") {
        window.alert("Укажите местоположение!");
        return;
    }

    let newWeatherItem = new WeatherItem("#weatherSecondaryTemplate", bookmarkLocation);
    await newWeatherItem.fetchWeather();
    let newWeatherNodeId = constructNodeId(bookmarkLocation);
    secondaryWeatherItems.set(newWeatherNodeId, newWeatherItem);

    secondaryWeatherLocations.add(newWeatherNodeId);
    commitWeatherLocations();

    rebuildSecondaryWeather();
}


function deleteWeatherBookmark() {
    let weatherId = event.target.closest('div[name="container"]').id;
    secondaryWeatherItems.delete(weatherId);
    secondaryWeatherLocations.delete(weatherId);
    commitWeatherLocations();

    rebuildSecondaryWeather();
}


function rebuildSecondaryWeather() {
    let clearfixTemplate = document.querySelector("#weatherClearfix").content;

    let wrapNode = document.querySelector(".weather__secondary__wrap");
    wrapNode.textContent = "";

    var i = 0;
    for (var [id, item] of secondaryWeatherItems) {
        i++;
        let node = item.build();
        node.querySelector(".weather__secondary__btn").addEventListener("click", deleteWeatherBookmark);
        wrapNode.appendChild(node);
        if (i % 2) {
            let clearfixNode = document.importNode(clearfixTemplate, true);
            wrapNode.appendChild(clearfixNode);
        }
    }
}


async function initWeatherBookmarks() {
    for (var weatherId of secondaryWeatherLocations) {
        let weatherBookmark = new WeatherItem("#weatherSecondaryTemplate", weatherId);
        await weatherBookmark.fetchWeather();
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
