
// Alexa Hangman Skill

// Jacopo Mangiavacchi.


var HangmanGame = require("./HangmanGame");

var welcomeOutput = "Welcome to the Hangman Game Alexa Skills Kit. You need to catch the word I guessed.  Try to catch this word one letter at a time";
var welcomeReprompt = "Try to say a letter.";

 // Skill Code =======================================================================================================

'use strict';
var Alexa = require('alexa-sdk');
var APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

var handlers = {
    'LaunchRequest': function () {
        getSecret( (secret) => {
            var game = new HangmanGame.HangmanGame(secret);
            this.attributes['persistedGame'] = game.saveToString();
            this.emit(':ask', welcomeOutput, welcomeReprompt);
        });
    },
    'Surrender': function () {
        var game = new HangmanGame.HangmanGame();
        game.loadFromString(this.attributes['persistedGame']);
        console.log(`The secret word is ${game.secret}`)
        this.emit(':ask', `The secret word was ${game.secret}`);
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
            handleTryLetter(letter, this);
        }
    },
    'TryLetterAlpha': function () {
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
            var letterAlpha = isSlotValid(this.event.request, "LetterAlpha");
            var letter = convertAlphaToLetter(letterAlpha)
            handleTryLetter(letter, this);
        }
    },
    'Explain': function () {
        var game = new HangmanGame.HangmanGame();
        game.loadFromString(this.attributes['persistedGame']);
        console.log(`The secret word is ${game.secret}`)
        this.emit(':ask', `The secret word is ${game.secret}`);
    },
    'Point': function () {
        var game = new HangmanGame.HangmanGame();
        game.loadFromString(this.attributes['persistedGame']);
        console.log(`You unsuccesfully tried ${game.failedAttempts} time and discovered ${game.lettersTried.length} letters`)
        this.emit(':ask', `You unsuccesfully tried ${game.failedAttempts} time and discovered ${game.lettersTried.length} letters`);
    },
    'AMAZON.HelpIntent': function () {
        speechOutput = "";
        reprompt = "";
        this.emit(':ask', speechOutput, reprompt);
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
        this.emit(':tell', speechOutput);
    },
};

exports.handler = (event, context) => {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    //alexa.resources = languageStrings;
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
                speechOutput = "Error";
                break;
        }

        alexaThis.attributes['persistedGame'] = game.saveToString();

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
            return slotValue;
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