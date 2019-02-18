const hotels = require('./relais_scraping.js');
const restaurants = require('./michelin_scraping.js');
let fs = require('fs');

'use strict';

const hotelJSON = hotels.getHotelsJSON();
const michelinJSON = restaurants.getRestaurantsJSON();

fs.writeFileSync("final.json",JSON.stringify(findMutualDetails(hotelJSON, michelinJSON)));

function findMutualDetails(hotels, michelins) {
    let starredHotels = [];
    for (let i = 0; i < hotels.length; i++) {
        for (let j = 0; j < michelins.length; j++) {
            if (hotels[i].chef === michelins[j].chef && hotels[i].postalCode === michelins[j].postalCode) {
                starredHotels.push({"hotelName": hotels[i].name, "restaurantName": michelins[j].name, "postalCode": hotels[i].postalCode, "chef": hotels[i].chef, "url": hotels[i].url, "price": hotels[i].price })
            }
        }
    }
    return starredHotels;
}
