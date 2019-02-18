/*const  fetch = require('node-fetch');
async function sandbox () {
    const response = await fetch("https://www.relaischateaux.com/fr/update-destination-results", {
        "credentials" : "include",
        "headers":{
            "accept":"*!/!*",
            "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "cache-control":"no-cache",
            "content-type":"application/x-www-form-urlencoded; charset=UTF-8",
            "pragma":"no-cache",
            "x-requested-width":"XMLHttpRequest"
        },
        "referrer":"https://www.relaischateaux.com/fr/destinations/europe/france",
        "referrerPolicy": "origin-when-cross-origin",
        "body":"page=1&areaId=78",
        "method":"POST",
        "mode":"cors"
    });
}*/

let Promise = require('promise');
let request = require('request');
let cheerio = require('cheerio');
let fs = require('fs');

let promises = [];
let eachPromises= [];
let hotels = [];
let scraping = 1;

function createPromise()
{
    let url = 'https://www.relaischateaux.com/fr/site-map/etablissements';
    promises.push(getHotels(url));
    console.log("Relais et Chateaux hotels added to the promise list");
}

function createEachPromises()
{
    return new Promise(function (resolve, reject)
    {
        if (scraping === 1) {
            for (let i = 0; i < Math.trunc(hotels.length / 2); i++) {
                let hotelURL = hotels[i].url;
                eachPromises.push(getHotelInfo(hotelURL, i));
                console.log("Added url of " + i + "th hotel to the promises list");
            }
            resolve();
            scraping++;
        } else if (scraping === 2) {
            for (let i = hotels.length / 2; i < Math.trunc(hotels.length); i++) {
                let hotelURL = hotels[i].url;
                eachPromises.push(getHotelInfo(hotelURL, i));
                console.log("Added url of " + i + "th hotel to the promises list");
            }
            resolve();
        }
    });
}

function getHotels(url)
{
    return new Promise(function (resolve, reject)
    {
        request(url, function (error, response, html)
        {
            if(error)
            {
                console.log(error);
                return reject(error);
            }
            else if (response.statusCode !== 200)

            {
                error = new Error("Unexpected status code :" + response.statusCode);
                error.response = response;
                return reject(error);
            }           //if (!error && response.statusCode == 200)

            let $ = cheerio.load(url);
            let frenchHotels = $('h3:contains("France")').next();
            frenchHotels.find('li').length
            frenchHotels.find('li').each(function ()
            {
                let data = $(this);
                let url = String(data.find('a').attr("href"));
                let name = data.find('a').first().text();
                name = name.replace(/\n/g, "");
                let chefName = String(data.find('a:contains("Chef")').text().split(' - ')[1]);
                chefName = chefName.replace(/\n/g, "");
                hotels.push({ "name": name.trim(), "postalCode": "", "chef": chefName.trim(), "url": url, "price": "" })
            });
            resolve(hotels);


        });
    });
}



function getHotelInfo(url, index) {
    return new Promise(function (resolve, reject) {
        request(url, function (error, response, html) {
            if(error)
            {
                console.error(error);
                return reject(error);
            }
            else if (response.statusCode !== 200)
            {
                error = new Error("Unexpected status code :" + response.statusCode);
                error.response = response;
                return reject(error);
            }
            const $ = cheerio.load(url);

            $('span[itemprop="postalCode"]').first().each(function () {
                let data = $(this);
                let pc = data.text();
                hotels[index].postalCode = String(pc.split(',')[0]).trim();
            });

            $('.price').first().each(function () {
                let data = $(this);
                let price = data.text();
                hotels[index].price = String(price);
            });
            console.log("Added postal code and price of " + index + "th hotel");
            resolve(hotels);



        });
    });
}

function createJSONforHotels() {
    return new Promise(function (resolve) {
        try {
            console.log("Editing JSON file");
            let jsonHotels = JSON.stringify(hotels);
            fs.writeFile("ListeHotels.json", jsonHotels, function doneWriting(error) {
                if (error) { console.log(error); }
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
let _promise =  promises[0];
_promise
    .then(createEachPromises)
    .then(() => { return Promise.all(eachPromises); })
    .then(createEachPromises)
    .then(() => { return Promise.all(eachPromises); })
    .then(createJSONforHotels())
    .then(() => { console.log("JSON file checked") });

module.exports.getHotelsJSON = function () {
    return JSON.parse(fs.readFileSync("ListeHotels.json"));
};
