
// Alexa Hangman Skill

// Jacopo Mangiavacchi.


var HangmanGame = require("./HangmanGame");

var welcomeOutput = "Welcome to the Hangman Game Alexa Skills Kit. You need to catch the secret word I guessed.  Try to catch this word one letter at a time";
var welcomeBackOutput1 = "Welcome back to the Hangman Game Alexa Skills Kit. I'm resuming this game from the previous session. ";
var welcomeBackOutput2 = "Now try to catch the secret word one letter at a time";
var newGameOutput = "Let's start another game now.  Try to catch the new secret word one letter at a time";
var welcomeReprompt = "Try to say a letter.";
var pauseString = ` <break time="1s"/> `;

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
            this.emit(':ask', `The secret word was <emphasis level="strong">${oldSecret}</emphasis>` + pauseString + newGameOutput, welcomeReprompt);
        });
    },
    'TryLetter': function () {
        var letter = isSlotValid(this.event.request, "Letter");
        if (letter === false) {
            this.emit(':ask', "Sorry, I don't understand what letter you want to try", "Please try a new letter.");
        }
        else {
            handleTryLetter(letter.substr(0, 1), this);
        }
    },
    'Guess': function () {
        if (this.event.request.dialogState === 'STARTED') {
            var updatedIntent = this.event.request.intent;
            //updatedIntent.slots.SlotName.value = 'DefaultValue';
            this.emit(':delegate', updatedIntent);
        } else if (this.event.request.dialogState !== undefined && this.event.request.dialogState !== 'COMPLETED'){
            this.emit(':delegate');
        } else {
            // All the slots are filled (And confirmed if you choose to confirm slot/intent)
            var word = isSlotValid(this.event.request, "word");
            if (word === false) {
                console.log("Slot not recognized 2");
                this.emit(':ask', "Sorry, I don't understand what word you want to try", "Please try a new letter.");
            }
            else {
                handleTryWord(word, this);
            }
        }
    },
    'Explain': function () {
        var game = new HangmanGame.HangmanGame();
        game.loadFromString(this.attributes['persistedGame']);

        getDefinition(game.secret, (definition) => {
            //console.log(`The definition of the secret word is ${definition}.  Try to cach a new letter now`)
            this.emit(':ask', `The definition of the secret word is <break time="1s"/> <emphasis level="strong">${definition}</emphasis>. <break time="2s"/> Try to cach a new letter now`);
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
        let endOfGame = false;

        switch (game.tryLetter(letter)) {
            case HangmanGame.tryLetterResult.won:
                speechOutput = `<say-as interpret-as="interjection">bingo!</say-as> You won. The secret word was ${game.secret}`;
                endOfGame = true;
                break;
        
            case HangmanGame.tryLetterResult.lost:
                speechOutput = `<say-as interpret-as="interjection">sigh!</say-as> Sorry you lost. The secret word was ${game.secret}`;
                endOfGame = true;
                break;
        
            case HangmanGame.tryLetterResult.alreadyTried:
                speechOutput = `<say-as interpret-as="interjection">honk!</say-as> You already tried the letter <say-as interpret-as=\"spell-out\">${letter}</say-as>.  Please try a new one`;
                break;
        
            case HangmanGame.tryLetterResult.found:
                speechOutput = `<say-as interpret-as="interjection">ha!</say-as> The secret word contain the letter <say-as interpret-as=\"spell-out\">${letter}</say-as>.  Try to cach a new letter now`;
                break;
        
            case HangmanGame.tryLetterResult.notFound:
                speechOutput = `<say-as interpret-as="interjection">moo!</say-as> Sorry, the secret word didn't contain the letter <say-as interpret-as=\"spell-out\">${letter}</say-as>. Please try a new one`;
                break;
        
            default:
                speechOutput = "Error on TryLetter";
                break;
        }

        if (endOfGame === true) {
            let word = game.secret;
            getSecret( (secret) => {
                var newGame = new HangmanGame.HangmanGame(secret);
                alexaThis.attributes['persistedGame'] = newGame.saveToString();
                alexaThis.emit(':saveState', true);
                alexaThis.emit(':ask', `You won. The secret word was <emphasis level="strong">${word}</emphasis>. <break time="1s"/> Try to catch a new word now. Please try a letter`, welcomeReprompt);
            });
        }
        else {
            alexaThis.attributes['persistedGame'] = game.saveToString();
            alexaThis.emit(':saveState', true);
            alexaThis.emit(':ask', speechOutput, "Please try a new letter.");
        }
    } else {
        console.log("Error");
        alexaThis.emit(":tell", 'error');
    }
}


function handleTryWord(word, alexaThis) {
    if (word) {
        var game = new HangmanGame.HangmanGame();

        if (alexaThis.attributes['persistedGame'] == undefined) {
            console.log('ERROR - Try Letter called without creating the game first')
        }
        else {
            game.loadFromString(alexaThis.attributes['persistedGame']);
        }

        if (word === game.secret) {
            getSecret( (secret) => {
                var newGame = new HangmanGame.HangmanGame(secret);
                alexaThis.attributes['persistedGame'] = newGame.saveToString();
                alexaThis.emit(':saveState', true);
                alexaThis.emit(':ask', `<say-as interpret-as="interjection">bingo!</say-as> You won. The secret word was <emphasis level="strong">${word}</emphasis>. <break time="1s"/> Try to catch a new word now. Please try a letter`, welcomeReprompt);
            });
        }
        else {
            alexaThis.emit(':ask', `<say-as interpret-as="interjection">sigh!</say-as> Sorry.  The secret word is not <emphasis level="strong">${word}</emphasis>`, "Please try a new letter.");
        }

    } else {
        console.log("Error2");
        alexaThis.emit(":tell", 'error2');
    }
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

    let points = game.lettersTried.length;
    let pointMessage = ""

    if (points === 0) {
        pointMessage = `You unsuccesfully tried ${game.failedAttempts} time and discovered no letters`;
    }
    else if (points === 1) {
        pointMessage = `You unsuccesfully tried ${game.failedAttempts} time and discovered the letter <break time="500ms"/> <say-as interpret-as=\"spell-out\">${game.lettersTried.substr(0, 1)}</say-as> `;
    }
    else {
        pointMessage = `You unsuccesfully tried ${game.failedAttempts} time and discovered ${points} letters <break time="250ms"/> <say-as interpret-as=\"spell-out\">${game.lettersTried.substr(0, 1)}</say-as> `;

        for (i = 1; i < points; i++) { 
            pointMessage += ` <break time="250ms"/> <emphasis level="strong">and</emphasis> <break time="250ms"/> <say-as interpret-as=\"spell-out\">${game.lettersTried.substr(i, 1)}</say-as> `
        }
    }

    return pointMessage
}