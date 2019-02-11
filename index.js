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

var request = require('request');
var cheerio = require('cheerio');
request('https://www.relaischateaux.com/fr/site-map/etablissements', function (error, response, html) {
    if (!error && response.statusCode == 200) {
        var $ = cheerio.load(html);
        $('span.comhead').each(function(i, element){
            var a = $(this).prev();
            console.log(a.text());
        });
    }
});