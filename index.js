// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
var https = require('https');

// function GetRate(item, callback) {
//     request('https://coincheck.com/api/rate/btc_jpy', function (error, response, body) {
//       console.log('error:', error); // Print the error if one occurred
//       console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
//       console.log('body:', body); // Print the HTML for the Google homepage.
//       const obj = JSON.parse(body);
//       callback(obj.rate);
//     });
// }

function httpGet(item) {
    return new Promise(((resolve, reject) => {
        var options = {
            host: 'coincheck.com',
            port: 443,
            path: '/api/rate/' + item.toLowerCase() + '_jpy',
            method: 'GET',
        };
        
        const request = https.request(options, (response) => {
        response.setEncoding('utf8');
        let returnData = '';

        response.on('data', (chunk) => {
            returnData += chunk;
        });

        response.on('end', () => {
            resolve(JSON.parse(returnData));
        });

        response.on('error', (error) => {
            reject(error);
        });
        });
        request.end();
    }));
}


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'どの通貨を知りたいですか？';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'OrderIntent';
    },
    async handle(handlerInput) {
        const notFound = '該当仮想通貨が見つかりませんでした';
        var speakOutput = '';
        try {
            const value = handlerInput.requestEnvelope.request.intent.slots.item.resolutions.resolutionsPerAuthority[0].values[0].value;
            const itemID = value.id;
            const itemName = handlerInput.requestEnvelope.request.intent.slots.item.value;
            const response = await httpGet(itemID);
            if (response && response.rate) {
                const rate = Math.floor(response.rate);
                speakOutput = itemName + 'は現在' + rate + '円です';
            } else {
                speakOutput = notFound;
            }
        } catch (e) {
            speakOutput = notFound;
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();

    }
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = '仮想通貨レートです。仮想通貨の名前を言ってください。';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = '仮想通貨レートです。キャンセルされました。';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `申し訳ございません、エラーが発生しました。再度お試しください。`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();
