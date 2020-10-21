function constructNodeId(src) {
    return src.replace(" ", "");
}


class WeatherError extends Error {
    constructor(message) {
        super(message);
        this.name = "WeatherError";
    }
}


export {constructNodeId, WeatherError}
