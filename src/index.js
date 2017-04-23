
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
        this.attributes['persistedGame'] = getNewGame();

        this.emit(':ask', welcomeOutput, welcomeReprompt);
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
            game.loadFromString(getNewGame());
        }
        else {
            game.loadFromString(alexaThis.attributes['persistedGame']);
        }

        var speechOutput = "";
        //speechOutput = "You already tried letter <say-as interpret-as=\"spell-out\">" + letter + "</say-as>.  Please try a new one";

        switch (game.tryLetter(letter)) {
            case HangmanGame.tryLetterResult.won:
                speechOutput = "You won";
                break;
        
            case HangmanGame.tryLetterResult.lost:
                speechOutput = "You lost";
                break;
        
            case HangmanGame.tryLetterResult.alreadyTried:
                speechOutput = "You already tried";
                break;
        
            case HangmanGame.tryLetterResult.found:
                speechOutput = "Letter founded";
                break;
        
            case HangmanGame.tryLetterResult.notFound:
                speechOutput = "Letter not founded";
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


function getNewGame() {
    var secret = "secret";

    var game = new HangmanGame.HangmanGame(secret);

    return game.saveToString();
}