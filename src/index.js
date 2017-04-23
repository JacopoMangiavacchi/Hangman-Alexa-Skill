
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
        //delegate to Alexa to collect all the required slot values
        //var filledSlots = delegateSlotCollection.call(this);

        var letter = isSlotValid(this.event.request, "Letter");

        if (letter) {

            var game = new HangmanGame.HangmanGame();

            if (this.attributes['persistedGame'] == undefined) {
                game.loadFromString(getNewGame());
            }
            else {
                game.loadFromString(this.attributes['persistedGame']);
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

            this.attributes['persistedGame'] = game.saveToString();

            this.emit(':ask', speechOutput, "Please try a new letter.");
        } else {
            console.log("Error");
            this.emit(":tell", 'error');
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


// Helper Function  =================================================================================================

function delegateSlotCollection(){
  console.log("in delegateSlotCollection");
  console.log("current dialogState: "+this.event.request.dialogState);
    if (this.event.request.dialogState === "BEGINNING") {
      console.log("in Beginning");
      var updatedIntent=this.event.request.intent;
      //optionally pre-fill slots: update the intent object with slot values for which
      //you have defaults, then return Dialog.Delegate with this updated intent
      // in the updatedIntent property
      this.emit(":delegate", updatedIntent);
    } else if (this.event.request.dialogState !== "COMPLETED") {
      console.log("in not completed");
      // return a Dialog.Delegate directive with no updatedIntent property.
      this.emit(":delegate");
    } else {
      console.log("in completed");
      console.log("returning: "+ JSON.stringify(this.event.request.intent));
      // Dialog is now complete and all required slots should be filled,
      // so call your normal intent handler.
      return this.event.request.intent;
    }
}

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