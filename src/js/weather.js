import { constructNodeId } from './utils.js'
import WeatherItem from './weather_item.js'


var secondaryWeatherItems = new Map();
var secondaryWeatherLocations = new Set();


function commitWeatherLocations() {
    localStorage.setItem("secondaryWeatherLocations", JSON.stringify(Array.from(secondaryWeatherLocations)));
}


function initWeatherHere() {
    let wrapNode = document.querySelector(".weather__primary__wrap");
    wrapNode.textContent = "";
    wrapNode.appendChild(getWeatherLoader());
    navigator.geolocation.getCurrentPosition(loadWeatherHere);
}


async function loadWeatherHere(location) {
    let coords = `${location.coords.latitude},${location.coords.longitude}`;
    let primaryWeatherItem = new WeatherItem("#weatherPrimaryTemplate", coords, "_here");
    let primaryWeather = primaryWeatherItem.build();

    let wrapNode = document.querySelector(".weather__primary__wrap");
    wrapNode.textContent = "";
    wrapNode.appendChild(primaryWeather);
}


async function addWeatherBookmark() {
    let bookmarkLocation = document.querySelector("#addBookmark").value;

    if (bookmarkLocation == "") {
        window.alert("Укажите местоположение!");
        return;
    }

    let newWeatherNodeId = constructNodeId(bookmarkLocation);
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

    let wrapNode = document.querySelector("main");
    wrapNode.textContent = "";

    var i = 0;
    for (var [id, item] of secondaryWeatherItems) {
        i++;
        let node = item.build();
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
