function constructNodeId(src) {
    console.log(src);
    return src.replace(" ", "").toLowerCase();
}


class WeatherError extends Error {
    constructor(message) {
        super(message);
        this.name = "WeatherError";
    }
}


export {constructNodeId, WeatherError}
