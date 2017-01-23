'use strict';

/**
 * Hangman Game Alexa Skill.
 */


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getNewSessionAttributes() {
    return {
        secretWord: "computer",
        wordsTried: ""
    };
}

function getWelcomeResponse(callback, sessionAttributes) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    if (sessionAttributes === null) {
        sessionAttributes = getNewSessionAttributes();
    }

    const cardTitle = 'Welcome';
    const speechOutput = 'Welcome to the Hangman Game Alexa Skills Kit. ' +
        'You need to catch the word I guessed.  Try to catch this word one letter at a time';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Please tell me your first letter';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for trying the Hangman Game Alexa Skills Kit. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function startGame(intent, session, callback) {
    const sessionAttributes = getNewSessionAttributes();

    const cardTitle = 'New Game';
    const speechOutput = 'Ok, I started a new game. ' +
        'You need to catch the word I guessed.  Try to catch this word one letter at a time';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Please tell me your first letter';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function tryLetter(intent, session, callback) {
    var sessionAttributes = session.attributes;
    var speechOutput = "";

    const letter = intent.slots.Letter.value

    console.log(`tryLetter ${letter}`);

    if (sessionAttributes.wordsTried.indexOf(letter) > -1) {
        speechOutput = "You already tried letter <say-as interpret-as=\"spell-out\">" + letter + "</say-as>.  Please try a new one";
    }
    else {
        sessionAttributes.wordsTried += letter;
        speechOutput = "My guessed word doesn't contain the letter <say-as interpret-as=\"spell-out\">" + letter + "</say-as>.  Please try a new one";
    }

    const cardTitle = 'Try Letter';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function tryLetterAlpha(intent, session, callback) {
    callback(null, buildResponse(session.attributes, "Letter Alpha"));
}

function surrender(intent, session, callback) {
    callback(null, buildResponse(session.attributes, "Surrender"));
}

function getPoint(intent, session, callback) {
    callback(null, buildResponse(session.attributes, "Point"));
}

function getExplanation(intent, session, callback) {
    callback(null, buildResponse(session.attributes, "Explanation"));
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    session.attributes = getNewSessionAttributes()
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback, session.attributes);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'Surrender') {
        surrender(intent, session, callback);
    } else if (intentName === 'Point') {
        getPoint(intent, session, callback);
    } else if (intentName === 'Explain') {
        getExplanation(intent, session, callback);
    } else if (intentName === 'TryLetter') {
        tryLetter(intent, session, callback);
    } else if (intentName === 'TryLetterAlpha') {
        tryLetterAlpha(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback, session.attributes);
    } else if (intentName === 'AMAZON.StartOverIntent' || intentName === 'AMAZON.RepeatIntent') {
        startGame(intent, session, callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent: ' + intentName);
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
