
// Alexa Hangman Skill

// Jacopo Mangiavacchi.


var HangmanGame = require("./HangmanGame");

var welcomeOutput = "Welcome to the Hangman Game Alexa Skills Kit. You need to catch the secret word I guessed.  Try to catch this word one letter at a time";
var welcomeBackOutput1 = "Welcome back to the Hangman Game Alexa Skills Kit. I'm resuming this game from the previous session. ";
var welcomeBackOutput2 = "Now try to catch the secret word one letter at a time";
var newGameOutput = "Let's start another game now.  Try to catch the new secret word one letter at a time";
var welcomeReprompt = "Try to say a letter.";
var pauseString = " <break time=\"1s\"/> ";

 // Skill Code =======================================================================================================

'use strict';
var Alexa = require('alexa-sdk');
var APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

var handlers = {
    'LaunchRequest': function () {
        if (this.attributes['persistedGame'] == undefined) {
            getSecret( (secret) => {
                var game = new HangmanGame.HangmanGame(secret);
                this.attributes['persistedGame'] = game.saveToString();
                this.emit(':saveState', true);
                this.emit(':ask', welcomeOutput, welcomeReprompt);
            });
        }
        else {
            var pointMessage = getPoint(this);
            this.emit(':ask', welcomeBackOutput1 + pointMessage + pauseString + welcomeBackOutput2, welcomeReprompt);
        }
    },
    'Surrender': function () {
        var game = new HangmanGame.HangmanGame();
        game.loadFromString(this.attributes['persistedGame']);
        var oldSecret = game.secret
        console.log(`The secret word was ${oldSecret}`)
        getSecret( (secret) => {
            var game = new HangmanGame.HangmanGame(secret);
            this.attributes['persistedGame'] = game.saveToString();
            this.emit(':saveState', true);
            this.emit(':ask', `The secret word was ${oldSecret}` + pauseString + newGameOutput, welcomeReprompt);
        });
    },
    'TryLetter': function () {
        if (this.event.request.dialogState === 'STARTED') {
            var updatedIntent = this.event.request.intent;
            // Pre-fill slots: update the intent object with slot values for which
            // you have defaults, then emit :delegate with this updated intent.
            //updatedIntent.slots.SlotName.value = 'DefaultValue';
            this.emit(':delegate', updatedIntent);
        } else if (this.event.request.dialogState !== undefined && this.event.request.dialogState !== 'COMPLETED'){
            this.emit(':delegate');
        } else {
            // All the slots are filled (And confirmed if you choose to confirm slot/intent)
            var letter = isSlotValid(this.event.request, "Letter");
            if (letter == false) {
                console.log("Slot not recognized");
                this.emit(':ask', "Sorry, I don't understand what letter you want to try", "Please try a new letter.");
            }
            else {
                handleTryLetter(letter, this);
            }
        }
    },
    'Explain': function () {
        var game = new HangmanGame.HangmanGame();
        game.loadFromString(this.attributes['persistedGame']);

        getDefinition(game.secret, (definition) => {
            console.log(`The definition of the secret word is ${definition}.  Try to cach a new letter now`)
            this.emit(':ask', `The definition of the secret word is <break time="1s"/> ${definition}. <break time="2s"/> Try to cach a new letter now`);
        });
    },
    'Point': function () {
        var pointMessage = getPoint(this);
        this.emit(':ask', pointMessage + pauseString + welcomeBackOutput2, welcomeReprompt);
    },
    'AMAZON.HelpIntent': function () {
        speechOutput = "";
        reprompt = "";
        this.emit(':ask', 'Try to catch the secret word saying for example <break time="1s"/> Try letter <say-as interpret-as=\"spell-out\">a</say-as>', "Please try a new letter now.");
    },
    'AMAZON.CancelIntent': function () {
        speechOutput = "";
        this.emit(':tell', speechOutput);
    },
    'AMAZON.StopIntent': function () {
        speechOutput = "";
        this.emit(':tell', speechOutput);
    },
    'SessionEndedRequest': function () {
        var speechOutput = "";
        this.emit(':saveState', true);
        this.emit(':tell', speechOutput);
    },
    ':saveStateError': function () {
        console.log('ERROR - :saveStateError')
        var speechOutput = "";
        this.emit(':tell', speechOutput);
    },
    'Unhandled': function() {
        console.log('Unhandled Intent!')
        this.emit(':ask', 'Sorry, I didn\'t get that. Try to catch the secret word saying for example <break time="1s"/> Try letter <say-as interpret-as=\"spell-out\">a</say-as>', "Please try a new letter now.");
    }
};

exports.handler = (event, context) => {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    //alexa.resources = languageStrings;
    alexa.dynamoDBTableName = 'Hangman';
    alexa.registerHandlers(handlers);
    alexa.execute();
};


function handleTryLetter(letter, alexaThis) {
    if (letter) {
        var game = new HangmanGame.HangmanGame();

        if (alexaThis.attributes['persistedGame'] == undefined) {
            console.log('ERROR - Try Letter called without creating the game first')
        }
        else {
            game.loadFromString(alexaThis.attributes['persistedGame']);
        }

        var speechOutput = "";

        switch (game.tryLetter(letter)) {
            case HangmanGame.tryLetterResult.won:
                speechOutput = `You won. The secret word was ${game.secret}`;
                break;
        
            case HangmanGame.tryLetterResult.lost:
                speechOutput = `Sorry you lost. The secret word was ${game.secret}`;
                break;
        
            case HangmanGame.tryLetterResult.alreadyTried:
                speechOutput = `You already tried the letter <say-as interpret-as=\"spell-out\">${letter}</say-as>.  Please try a new one`;
                break;
        
            case HangmanGame.tryLetterResult.found:
                speechOutput = `Good. The secret word contain the letter <say-as interpret-as=\"spell-out\">${letter}</say-as>.  Try to cach a new letter now`;
                break;
        
            case HangmanGame.tryLetterResult.notFound:
                speechOutput = `Sorry. The secret word didn't contain the letter <say-as interpret-as=\"spell-out\">${letter}</say-as>. Please try a new one`;
                break;
        
            default:
                speechOutput = "Error on TryLetter";
                break;
        }

        alexaThis.attributes['persistedGame'] = game.saveToString();
        alexaThis.emit(':saveState', true);
        alexaThis.emit(':ask', speechOutput, "Please try a new letter.");
    } else {
        console.log("Error");
        alexaThis.emit(":tell", 'error');
    }
}

function convertAlphaToLetter(letterAlpha) {
    // var converter = {
    //     'alfa' : 'a',
    //     'bravo' : 'b',
    //     'charlie' : 'c',
    //     'delta' : 'd',
    //     'echo' : 'e',
    //     'foxtrot' : 'f',
    //     'golf' : 'g',
    //     'hotel' : 'h',
    //     'india' : 'i',
    //     'juliett' : 'j',
    //     'kilo' : 'k',
    //     'lima' : 'l',
    //     'mike' : 'm',
    //     'november' : 'n',
    //     'oscar' : 'o',
    //     'papa' : 'p',
    //     'quebec' : 'q',
    //     'romeo' : 'r',
    //     'sierra' : 's',
    //     'tango' : 't',
    //     'uniform' : 'u',
    //     'victor' : 'v',
    //     'whiskey' : 'w',
    //     'x-ray' : 'x',
    //     'yankee' : 'y',
    //     'zulu' : 'z'};

    // return converter[letterAlpha];
    return letterAlpha.substring(0, 1);
}

// Helper Function  =================================================================================================

function isSlotValid(request, slotName){
        var slot = request.intent.slots[slotName];
        //console.log("request = "+JSON.stringify(request)); //uncomment if you want to see the request
        var slotValue;

        //if we have a slot, get the text and store it into speechOutput
        if (slot && slot.value) {
            //we have a value in the slot
            slotValue = slot.value.toLowerCase();
            return slotValue.substring(0, 1);
        } else {
            //we didn't get a value in the slot.
            return false;
        }
}


function getSecret(callback) {
    var url = `http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=true&minCorpusCount=0&minLength=5&maxLength=15&limit=1&api_key=${process.env.WORDNIK_APIKEY}`

    var request = require('request');
    request(url, function (error, response, body) {
        var jsonBody = JSON.parse(body);
        var secret = jsonBody[0].word;
        callback(secret);
    });
}

function getDefinition(secret, callback) {
    var url = `http://api.wordnik.com/v4/word.json/${secret}/definitions?api_key=${process.env.WORDNIK_APIKEY}`

    var request = require('request');
    request(url, function (error, response, body) {
        var jsonBody = JSON.parse(body);
        var definition = jsonBody[0].text;
        callback(definition);
    });
}


function getPoint(alexaThis) {
    var game = new HangmanGame.HangmanGame();
    game.loadFromString(alexaThis.attributes['persistedGame']);
    var pointMessage = `You unsuccesfully tried ${game.failedAttempts} time and discovered ${game.lettersTried.length} letters`
    return pointMessage
}