var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var Promise = require('promise');

var promises = [];
var eachPromises = [];
var restaurants = [];
var scraping = 0;

function createPromises() {
    for (let i = 1; i <= 37; i++) {
        let url = 'https://restaurant.michelin.fr/restaurants/france/restaurants-1-etoile-michelin/restaurants-2-etoiles-michelin/restaurants-3-etoiles-michelin/page-' + i.toString();
        promises.push(getRestaurants(/*proxyUrl + */url));
    }
}


function getRestaurants(url) {
    return new Promise(function (resolve, reject) {
        request(url, function (error, response, html) {
            if (error) {
                console.error(error)
                return reject(error);

            }
            else if (response.statusCode !== 200) { //200 means request succesfull
                error = new Error("Unexpected status code : " + response.statusCode);
                error.res = response;
                console.error(error)
                return reject(error);
            }
            var $ = cheerio.load(html);
            $('.poi-card-link').each(function () {
                let data = $(this);
                let link = data.attr("href");
                let url = "https://restaurant.michelin.fr/" + link;
                restaurants.push({ "name": "", "postalCode": "", "chef": "", "url": url })
            })
            resolve(restaurants);
        });
    });
}


function createEachPromise() {
    return new Promise(function (resolve, reject) {
        if (scraping === 0) {
            for (let i = 0; i < restaurants.length / 2; i++) {
                let restaurantURL = restaurants[i].url;
                eachPromises.push(getInfos(/*proxyUrl + */restaurantURL, i));

            }
            resolve();
            scraping++;
        }
        if (scraping === 1) {
            for (let i = restaurants.length / 2; i < restaurants.length; i++) {
                let restaurantURL = restaurants[i].url;
                eachPromises.push(getInfos(/*proxyUrl + */restaurantURL, i));

            }
            resolve();
        }
    })
}


function getInfos(url, index) {
    return new Promise(function (resolve, reject) {
        request(url, function (error, response, html) {
            if (error) {
                console.error(error);
                return reject(error);
            }
            else if (response.statusCode !== 200) {
                error = new Error("Unexpected status code : " + response.statusCode);
                error.res = response;
                console.error(error)
                return reject(error);
            }

            const $ = cheerio.load(html);
            $('.poi_intro-display-title').first().each(function () {
                let data = $(this);
                let name = data.text();
                name = name.replace(/\n/g, ""); //We need to take out all the newlines because this would cause some problems for the json
                restaurants[index].name = name.trim();
            })

            $('.postal-code').first().each(function () {
                let data = $(this);
                let pc = data.text();
                restaurants[index].postalCode = pc;
            })

            $('#node_poi-menu-wrapper > div.node_poi-chef > div.node_poi_description > div.field.field--name-field-chef.field--type-text.field--label-above > div.field__items > div').first().each(function () {
                let data = $(this);
                let chefName = data.text();
                restaurants[index].chef = chefName;
            })
            resolve(restaurants);
        });
    });
}

function createJson() {
    return new Promise(function (resolve, reject) {
        try {
            var jsonRestaurants = JSON.stringify(restaurants);
            fs.writeFile("Michelin.json", jsonRestaurants, function doneWriting(error) {
                if (error) { console.error(error); }
            });
        }
        catch (error) {
            console.error(error);
        }
        resolve();
    });
}


createPromises();
Promise.all(promises)
    .then(createEachPromise)
    .then(() => { return Promise.all(eachPromises); })
    .then(createEachPromise)
    .then(() => { return Promise.all(eachPromises); })
    .then(createJson)



module.exports.getRestaurantsJSON = function () {
    return JSON.parse(fs.readFileSync("Michelin.json"));
};