var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');
var os = require('os');

//=========================================================
// SWAPI 
//=========================================================
var SWAPI_URL = "http://swapi.co/api/"

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

server.get('/', restify.serveStatic({
  'directory': __dirname,
  'default': 'index.html'
}));

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', new builder.IntentDialog()
    .matches(/^hello/i, function (session) {
        session.send("Hi, I'm SWAPI Bot!");
    })
    .matches(/^hi/i, function (session) {
        session.send("Hi, I'm SWAPI Bot!");
    })
    .matches(/^help/i, function (session) {
        session.send("Type 'people', 'planets', or 'starships' to learn more.");
    })
    .matches(/^people/i, function (session) {
        session.beginDialog('/searchPerson');
    })
    .matches(/^planets/i, function (session) {
        session.beginDialog('/searchPlanets');
    })
    .matches(/^starships/i, function (session) {
        session.beginDialog('/searchSpaceships')
    })
    .onDefault(function (session) {
        session.send("Try typing 'help' to see what I can do!");
    }));

bot.dialog('/searchPerson', [
    function (session) {
        var regex = /\d/g;
        var res = regex.test(session.message.text);
        if (!res) {
            builder.Prompts.text(session, "Type 'people' and a number to search the SWAPI database");
        }
        else {
            var fullURL = SWAPI_URL + session.message.text.replace(" ", "/");
            request(fullURL, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    formatAndEndCharacters(session, body);
                }
                else {
                    session.endDialog("Sorry, I wasn't able to find anything");
                }
            })
        }
    },
    function (session, results) {
        var fullURL = SWAPI_URL + results.response.replace(" ", "/");
        request(fullURL, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                formatAndEndCharacters(session, body);
            }
            else {
                session.endDialog("Sorry, I wasn't able to find anything");
            }
        })

    }
]);

bot.dialog('/searchPlanets', [
    function (session) {
        var regex = /\d/g;
        var res = regex.test(session.message.text);
        if (!res) {
            builder.Prompts.text(session, "Type 'planets' and a number to search the SWAPI database");
        }
        else {
            var fullURL = SWAPI_URL + session.message.text.replace(" ", "/");
            request(fullURL, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    formatAndEndPlanets(session, body);
                }
                else {
                    session.endDialog("Sorry, I wasn't able to find anything");
                }
            })
        }
    },
    function (session, results) {
        var fullURL = SWAPI_URL + results.response.replace(" ", "/");
        request(fullURL, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                formatAndEndPlanets(session, body);
            }
            else {
                session.endDialog("Sorry, I wasn't able to find anything");
            }
        })

    }
]);

bot.dialog('/searchSpaceships', [
    function (session) {
        var regex = /\d/g;
        var res = regex.test(session.message.text);
        if (!res) {
            builder.Prompts.text(session, "Type 'starships' and a number to search the SWAPI database");
        }
        else {
            var fullURL = SWAPI_URL + session.message.text.replace(" ", "/");
            request(fullURL, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    formatAndEndStarships(session, body);
                }
                else {
                    session.endDialog("Sorry, I wasn't able to find anything");
                }
            })
        }
    },
    function (session, results) {

        var fullURL = SWAPI_URL + results.response.replace(" ", "/");
        request(fullURL, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                formatAndEndStarships(session, body);
            }
            else {
                session.endDialog("Sorry, I wasn't able to find anything");
            }
        })

    }
]);

var formatAndEndCharacters = function FormatResponseAndEndSession(mySession, myResponse) {
    var obj = JSON.parse(myResponse);
    var formattedString = ("Height: " + obj.height + 'cm \n\n' +
        "Birth Year: " + obj.birth_year + '\n\n' +
        "In " + obj.films.length + " films");
    getBingSearchResult(obj.name, mySession, formattedString);
    mySession.endDialog();
}

var formatAndEndPlanets = function FormatResponseAndEndSession(mySession, myResponse) {
    var obj = JSON.parse(myResponse);
    var formattedString = (
        "Climate: " + obj.climate + '\n\n' +
        "Terrain: " + obj.terrain + '\n\n' +
        "Population: " + obj.population);
    getBingSearchResult(obj.name, mySession, formattedString);
    mySession.endDialog();
}

var formatAndEndStarships = function FormatResponseAndEndSession(mySession, myResponse) {
    var obj = JSON.parse(myResponse);
    var formattedString = (obj.manufacturer + '\n\n' +
        "Cost: " + obj.cost_in_credits + 'credits \n\n' +
        obj.crew + " crew, " + obj.passengers + " passengers");
    getBingSearchResult(obj.name, mySession, formattedString);
    mySession.endDialog();
}


/**
 * Pass in the name of the search from the chat bot and desired subtitle
 * Query search results and create a hero card, then send the response
 */
var getBingSearchResult = function GetSearch(characterName, session, subtitleString) {
    var key = process.env.BING_KEY; 
    var options = {
        url: 'https://api.cognitive.microsoft.com/bing/v5.0/images/search?count=1&q=' + encodeURIComponent(characterName),
        headers: {
            'Ocp-Apim-Subscription-Key': key
        }
    };
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body);
            var createImgCard = createHeroCard(session, characterName, subtitleString, info.value[0].thumbnailUrl);
            var msg = new builder.Message(session).addAttachment(createImgCard);
            session.send(msg);
        }
    }
    request(options, callback);
}

/**
 * Create a hero card based on the information sent from the Bing Images API
 */
function createHeroCard(session, name, subtitle, url) {
    return new builder.HeroCard(session)
        .title(name)
        .subtitle()
        .text(subtitle)
        .images(getSampleCardImages(session, url))
        .buttons();
}

function getSampleCardImages(session, url) {
    return [
        builder.CardImage.create(session, url)
    ];
}