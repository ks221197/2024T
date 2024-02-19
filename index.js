const express = require('express');
const availableLocation = require('./city-lat-lng.json');
const availableDrivers = require('./driver.json');
const currencyExchange = require('./currency.json');

const app = express();

function findDrivers(start, end) {
    console.log('findDrivers', start, end);
    if (!start || start == '') {
        console.log("Start location is required!!");
    }
    //check if entered place is available or not
    const startPlaceValue = availableLocation.find(city => city.name.toLowerCase() == start.toLowerCase());
    const endPlaceValue = availableLocation.find(city => city.name.toLowerCase() == end.toLowerCase());

    if (!startPlaceValue) { return []; } //default empty array return, if not match found!!
    if (!endPlaceValue) { return []; } //default empty array return, if not match found!!

    const distance = findDistance(startPlaceValue.lat, startPlaceValue.lon, endPlaceValue.lat, endPlaceValue.lon);
    console.log('distance', distance);

    //check entered location is preferred location in driver or not
    // const inAvailablePlaceDrivers = [];
    // availableDrivers.forEach(driver => {
    //     if (driver.prefferedStartLocation.includes(startPlaceValue.name) || driver.prefferedEndLocation.includes(endPlaceValue.name)) {
    //         inAvailablePlaceDrivers.push(driver);
    //     }
    // });

    const finalDrivers = [];
    // if (availableDrivers.length > 0) {
    for (const driver of availableDrivers) {
        if (!driver.isHired) {
            const distanceRate = findDistanceRate(distance, driver);
            const driverUnprefferedLocationRate = driver.unprefferedLocationRate;
            const driverHourlyRate = driver.hourlyRate;

            const distanceWiseRate = distance * distanceRate;
            const driverSpecificRate = distanceWiseRate * driverUnprefferedLocationRate;
            const driverFuelSpecificRate = distance * driverHourlyRate;

            let totalRate = driverSpecificRate + driverFuelSpecificRate;

            if (driver.currency !== "$") {
                const currencyRate = currencyExchange.find(currency => currency.fromCurrency == driver.currency && currency.toCurrency == '$');
                if (currencyRate) {
                    totalRate = totalRate / currencyRate.rate;
                }
            }

            finalDrivers.push({
                driverId: driver.id,
                totalKM: `${distance}Km`,
                driverPay: `$${totalRate.toFixed(2)}`,
            });
        }
    }
    // }
    return finalDrivers;
}

function findDistanceRate(distance, driver) {
    if (distance <= 50) {
        return driver.distanceBasedRate['0-50'];
    } else if (distance <= 100) {
        return driver.distanceBasedRate['51-100'];
    } else if (distance <= 150) {
        return driver.distanceBasedRate['101-150'];
    } else if (distance <= 200) {
        return driver.distanceBasedRate['151-200'];
    } else {
        return driver.distanceBasedRate['200+'];
    }
}

function findDistance(lat1, lon1, lat2, lon2) {
    console.log(lat1, lon1, lat2, lon2);
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(2);
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

app.get('/',async function (req, res) {
    console.log(req.query.start, req.query.end);
    const start = req.query.start
    const end = req.query.end

    if (!start) {
        res.end('Please enter start location!!');
    }
    if (!end) {
        res.end('Please enter end location!!');
    }
    const driverList = await findDrivers(start, end)
    res.end(JSON.stringify(driverList));
})

app.listen(4000)