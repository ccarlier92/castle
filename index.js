const Promise = require('promise');
const relais = require('relais_scraping.js');
const michelin = require('michelin_scraping.js');
const fs = require('fs');


'use strict';

const hotelsJSON = relais.getHotelsJSON();
const michelinJSON = michelin.getRestaurantsJSON();

fs.writeFileSync("Final.json",JSON.stringify(findMutualDetails(hotelsJSON, michelinJSON)));

function findMutualDetails(hotels, michelin) {
    let starredHotels = [];
    for (let i = 0; i < hotels.length; i++) {
        for (let j = 0; j < michelin.length; j++) {
            if (hotels[i].chef === michelin[j].chef && hotels[i].postalCode === michelin[j].postalCode) {
                starredHotels.push({"hotelName": hotels[i].name, "restaurantName": michelin[j].name, "postalCode": hotels[i].postalCode, "chef": hotels[i].chef, "url": hotels[i].url, "price": hotels[i].price })
            }
        }
    }
    return starredHotels;
}