
// Alexa Hangman Skill

// Jacopo Mangiavacchi.


var HangmanGame = require("./HangmanGame");

var maxNumberOfTry = 9;

var welcomeOutput = "Welcome to the Hangman Game Alexa Skills. You need to catch the secret word I guessed.  Try to catch this word one letter at a time";
var welcomeBackOutput1 = "Welcome back to the Hangman Game Alexa Skills Kit. I'm resuming this game from the previous session. ";
var welcomeBackOutput2 = "Now try to catch the secret word one letter at a time";
var newGameOutput = "Let's start another game now.  Try to catch the new secret word one letter at a time";
var welcomeReprompt = "Try to say a letter.";
var pauseString = ` <break time="500ms"/> `;

 // Skill Code =======================================================================================================

'use strict';
var Alexa = require('alexa-sdk');
var APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

var handlers = {
    'LaunchRequest': function () {
        if (this.attributes['persistedGame'] == undefined) {
            getSecret( (secret) => {
                var game = new HangmanGame.HangmanGame(secret, maxNumberOfTry);
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
        //console.log(`The secret word was ${oldSecret}`)
        getSecret( (secret) => {
            var game = new HangmanGame.HangmanGame(secret, maxNumberOfTry);
            this.attributes['persistedGame'] = game.saveToString();
            this.emit(':saveState', true);
            this.emit(':ask', `The secret word was <break time="1s"/> <emphasis level="strong">${oldSecret}</emphasis>` + pauseString + newGameOutput, welcomeReprompt);
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
            this.emit(':ask', `The definition of the secret word is <break time="1s"/> <emphasis level="moderate">${definition}</emphasis>. <break time="2s"/> Try to cach a new letter now`);
        });
    },
    'Point': function () {
        var pointMessage = getPoint(this);
        this.emit(':ask', pointMessage + pauseString + welcomeBackOutput2, welcomeReprompt);
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', 'Try to catch the secret word saying for example <break time="1s"/> Try letter <say-as interpret-as=\"spell-out\">a</say-as> <break time="1s"/> or saying <break time="500ms"/> Try Letter <break time="500ms"/> and any word you want, to try the first letter of this word. <break time="1s"/> You can also try to guess the entire word, saying for example <break time="500ms"/> Is the word secret? <break time="1s"/> or just ask to recap your points', "Please try a new letter now.");
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', "OK. I've saved this session so you can restart from this next time you open the Hangman Game Skill.  Goodbye");
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', "OK. I've saved this session so you can restart from this next time you open the Hangman Game Skill.  Goodbye");
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
                speechOutput = `<say-as interpret-as="interjection">bingo!</say-as> You won. The secret word was <break time="1s"/> ${game.secret} <break time="1s"/> Try to catch a new word now. Please try a letter`;
                endOfGame = true;
                break;
        
            case HangmanGame.tryLetterResult.lost:
                speechOutput = `<say-as interpret-as="interjection">sigh!</say-as> Sorry you lost. The secret word was <break time="1s"/> ${game.secret} <break time="1s"/> Try to catch a new word now. Please try a letter`;
                endOfGame = true;
                break;
        
            case HangmanGame.tryLetterResult.alreadyTried:
                speechOutput = `<say-as interpret-as="interjection">honk!</say-as> You already tried the letter <say-as interpret-as=\"spell-out\">${letter}</say-as>.  Please try a new one`;
                break;
        
            case HangmanGame.tryLetterResult.found:
                speechOutput = `<say-as interpret-as="interjection">ha!</say-as> The secret word contain the letter <say-as interpret-as=\"spell-out\">${letter}</say-as>. <break time="500ms"/>`  
                speechOutput += getDiscover(game);
                speechOutput += `<break time="1s"/> Try to cach a new letter now`;
                break;
        
            case HangmanGame.tryLetterResult.notFound:
                speechOutput = `<say-as interpret-as="interjection">moo!</say-as> Sorry, the secret word didn't contain the letter <say-as interpret-as=\"spell-out\">${letter}</say-as>. `;
                if (game.failedAttempts == maxNumberOfTry - 2) {
                    speechOutput += ` <break time="250ms"/> Watch out, you only have two more tentatives. `;
                }
                else if (game.failedAttempts == maxNumberOfTry - 1) {
                    speechOutput += ` <break time="250ms"/> Watch out, you only have one last tentative. `;
                }
                speechOutput += ` Please try a new letter.`;
                break;
        
            default:
                speechOutput = "Error on TryLetter";
                break;
        }

        if (endOfGame === true) {
            getSecret( (secret) => {
                var newGame = new HangmanGame.HangmanGame(secret, maxNumberOfTry);
                alexaThis.attributes['persistedGame'] = newGame.saveToString();
                alexaThis.emit(':saveState', true);
                alexaThis.emit(':ask', speechOutput, welcomeReprompt);
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
                var newGame = new HangmanGame.HangmanGame(secret, maxNumberOfTry);
                alexaThis.attributes['persistedGame'] = newGame.saveToString();
                alexaThis.emit(':saveState', true);
                alexaThis.emit(':ask', `<say-as interpret-as="interjection">bingo!</say-as> You won. The secret word was <break time="1s"/> <emphasis level="strong">${word}</emphasis>. <break time="1s"/> Try to catch a new word now. Please try a letter`, welcomeReprompt);
            });
        }
        else {
            alexaThis.emit(':ask', `<say-as interpret-as="interjection">sigh!</say-as> Sorry.  The secret word is not <break time="1s"/> <emphasis level="strong">${word}</emphasis>`, "Please try a new letter.");
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
    //var url = `http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=true&minCorpusCount=0&minLength=5&maxLength=12&limit=1&api_key=${process.env.WORDNIK_APIKEY}`
    var url = `http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=true&includePartOfSpeech=noun&excludePartOfSpeech=proper-noun&minCorpusCount=1&maxCorpusCount=-1&minDictionaryCount=3&maxDictionaryCount=-1&minLength=5&maxLength=8&limit=1&api_key=${process.env.WORDNIK_APIKEY}`

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

function getDiscover(game) {
    let discoverMessage = "";
    let discovered = game.discovered;
    let discoveredLetters = discovered.replace(/_/g,"")

    // console.log(`SECRET: ${game.secret}`);
    // console.log(`DISCOVERED: ${discovered}`);
    // console.log(`DISCOVERED_LETTERS: ${discoveredLetters}`);

    if (discoveredLetters.length > 0) {
        discoverMessage = `The currently discovered word is `
        for (i = 0; i < discovered.length; i++) { 
            discoverMessage += `<break time="500ms"/> <say-as interpret-as=\"spell-out\">${discovered.substr(i,1)}</say-as> `;
        }
        discoverMessage += `<break time="500ms"/> And is ${game.secret.length} letters length `;
    }
    else {
        discoverMessage = `The currently discovered word is ${game.secret.length} letters length `;
    }

    return discoverMessage
}

function getPoint(alexaThis) {
    var game = new HangmanGame.HangmanGame();
    game.loadFromString(alexaThis.attributes['persistedGame']);

    let pointMessage = "";

    if (game.lettersTried.length === 0) {
        pointMessage = `This is a brand new game and you didn't tried any letters yet. <break time="500ms"/> The secret word is ${game.secret.length} characters length`;
    }
    else {
        let discovered = game.discovered;
        let discoveredLetters = discovered.replace(/_/g,"")

        pointMessage = getDiscover(game);
        pointMessage += `<break time="500ms"/> You still need to discover ${(game.secret.length - discoveredLetters.length)} letters `;

        let notPresentLetters = game.lettersTried.split("").filter((letter) => discoveredLetters.indexOf(letter) == -1 ).join("");

        // let notPresentLetters = "";
        // for (i = 0; i < game.lettersTried.length; i++) {
        //     let letter = game.lettersTried.substr(i,1);
        //     if (discoveredLetters.indexOf(letter) == -1 ) {
        //         notPresentLetters += letter;
        //     }
        // }

        // console.log(`NOT_PRESENT_LETTERS: ${notPresentLetters}`);

        if (notPresentLetters.length == 1) {
            pointMessage += `<break time="500ms"/> You already tried the letter <say-as interpret-as=\"spell-out\">${notPresentLetters}</say-as> `;
        }
        else if (notPresentLetters.length > 0) {
            pointMessage += `<break time="500ms"/> You already tried these other letters `;

            for (i = 0; i < notPresentLetters.length; i++) { 
                pointMessage += `<break time="250ms"/> <say-as interpret-as=\"spell-out\">${notPresentLetters.substr(i,1)}</say-as> `;
            }
        }
    }

    return pointMessage;
}

