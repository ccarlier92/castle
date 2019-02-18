let request = require('request');
let cheerio = require('cheerio');
let Promise = require('promise');
let fs = require('fs');

let promises = [];
let eachPromises= [];
let restaurants = [];
let scraping = 1;

function createPromise()
{
    for (i = 1; i <= 37; i++) {
        let url = 'https://restaurant.michelin.fr/restaurants/france/restaurants-1-etoile-michelin/restaurants-2-etoiles-michelin/restaurants-3-etoiles-michelin/page-\' + i.toString();'
        promises.push(getRestaurants(url));
        console.log("Michelin restaurants of the "+ i+  "th page added to the promise list");
    }
}

function getRestaurants()
{
    return new Promise(function (resolve, reject)
    {
        request(url, function (error, response, html)
        {
            if (!error && response.statusCode == 200) {
                let $ = cheerio.load(html);
                $('.poi-card-link').each(function () {
                    let data = $(this);
                    let link = data.attr("href");
                    let url = "https://restaurant.michelin.fr/" + link;
                    restaurants.push({"name": "", "postalCode": "", "chef": "", "url": url})
                });
                resolve(restaurants);
            }
        });
    });
}

function createEachPromises() {
    return new Promise(function (resolve) {
        if (scraping == 1) {
            for (let i = 0; i < restaurants.length / 2; i++) {
                let restaurantURL = restaurants[i].url;
                eachPromises.push(getRestaurantInfo(restaurantURL, i));
                console.log("Added url of " + i + "th restaurant to the promises list");
            }
            resolve();
            scraping++;
        }
        if (scraping == 2) {
            for (i = restaurants.length / 2; i < restaurants.length; i++) {
                let restaurantURL = restaurants[i].url;
                eachPromises.push(getRestaurantInfo(restaurantURL, i));
                console.log("Added url of " + i + "th restaurant to the promises list");
            }
            resolve();
        }
    })
}
function getRestaurantInfo(url, index) {
    return new Promise(function (resolve, reject) {
        request(url, function (error, response, html) {
            if(!error && response.statusCode == 200)
            {
                let $ = cheerio.load(html);
                $('.poi_intro-display-title').first().each(function () {
                    let data = $(this);
                    let name = data.text();
                    name = name.replace(/\n/g, "");
                    restaurants[index].name = name.trim();
                });

                $('.postal-code').first().each(function () {
                    let data = $(this);
                    let pc = data.text();
                    restaurants[index].postalCode = pc;
                });

                $('#node_poi-menu-wrapper > div.node_poi-chef > div.node_poi_description > div.field.field--name-field-chef.field--type-text.field--label-above > div.field__items > div').first().each(function () {
                    let data = $(this);
                    let chefName = data.text();
                    restaurants[index].chef = chefName;
                });
                console.log("Added info of " + index + "th restaurant");
                resolve(restaurants);
            }
        });
    });
}

function createJSONforRestaurants()
{
    return new Promise(function (resolve) {
        try {
            console.log("Editing JSON file");
            let jsonRestaurants = JSON.stringify(restaurants);
            fs.writeFile("ListeRestaurants.json", jsonRestaurants, function doneWriting(error) {
                if (error) { console.error(error); }
            });
        }
        catch (error) {
            console.error(error);
        }
        resolve();
    });
}
//main
createPromise();
let _promise = promises[0];
_promise
    .then(createEachPromises)
    .then(() => { return Promise.all(eachPromises); })
    .then(createEachPromises)
    .then(() => { return Promise.all(eachPromises); })
    .then(createJSONforRestaurants())
    .then(() => { console.log("JSON file checked") });

module.exports.getRestaurantsJSON = function () {
    return JSON.parse(fs.readFileSync("ListeRestaurants.json"));
};