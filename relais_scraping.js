var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var Promise = require('promise');

var promises = [];
var eachPromises = [];
var hotels = [];
var scraping = 0;

function createPromise() {
    let url = 'https://www.relaischateaux.com/fr/site-map/etablissements'
    promises.push(getHotels(/*proxyUrl + */url));
}

function getHotels(url) {
    return new Promise(function (resolve, reject) {
        request(url, function (err, res, html) {
            if (err) {
                console.log(err)
                return reject(err);
            }
            else if (res.statusCode !== 200) {
                err = new Error("Unexpected status code : " + res.statusCode);
                err.res = res;
                return reject(err);
            }
            var $ = cheerio.load(html);

            let frenchHotels = $('h3:contains("France")').next();
            frenchHotels.find('li').length
            frenchHotels.find('li').each(function () {
                let data = $(this);
                let url = String(data.find('a').attr("href"));
                let name = data.find('a').first().text();
                name = name.replace(/\n/g, "");
                let chefName = String(data.find('a:contains("Chef")').text().split(' - ')[1]);
                chefName = chefName.replace(/\n/g, "");
                hotels.push({ "name": name.trim(), "postalCode": "", "chef": chefName.trim(), "url": url, "price": "" })
            })
            resolve(hotels);
        });
    });
}

function createEachPromise() {
    return new Promise(function (resolve, reject) {
        if (scraping === 0) {
            for (let i = 0; i < Math.trunc(hotels.length / 2); i++) {
                let hotelURL = hotels [i].url;
                eachPromises.push(getInfos(/*proxyUrl + */hotelURL, i));

            }
            resolve();
            scraping++;
        }
        else if (scraping === 1) {
            for (let i = hotels.length / 2; i < Math.trunc(hotels.length); i++) {
                let hotelURL = hotels [i].url;
                eachPromises.push(getInfos(/*proxyUrl + */hotelURL, i));

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
                return reject(error);
            }

            const $ = cheerio.load(html);

            $('span[itemprop="postalCode"]').first().each(function () {
                let data = $(this);
                let pc = data.text();
                hotels[index].postalCode = String(pc.split(',')[0]).trim();
            })

            $('.price').first().each(function () {
                let data = $(this);
                let price = data.text();
                hotels[index].price = String(price);
            })

            resolve(hotels);
        });
    });
}

function createJson() {
    return new Promise(function (resolve, reject) {
        try {
            var jsonHotels = JSON.stringify(hotels);
            fs.writeFile("Hotels.json", jsonHotels, function doneWriting(err) {
                if (err) { console.log(err); }
            });
        }
        catch (error) {
            console.error(error);
        }
        resolve();
    });
}

createPromise();
var prom = promises[0];
prom
    .then(createEachPromise())
    .then(() => { return Promise.all(eachPromises); })
    .then(createEachPromise())
    .then(() => { return Promise.all(eachPromises); })
    .then(createJson)


module.exports.getHotelsJSON = function () {
    return JSON.parse(fs.readFileSync("Hotels.json"));
};