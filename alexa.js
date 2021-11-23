'use strict';

const Alexa = require('ask-sdk-core');
const SurePetClient = require('./surepet_client');
const Config = require('./config');
const getMeow = require('./meow_helper');


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    async handle(handlerInput) {

        const speechText = 'Okay, what would you like me to do?';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();

    }
};

const LockRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'LockDoor';
    },
    async handle(handlerInput) {

        let client = new SurePetClient(Config.authToken);
        let result = await client.lockDoor(Config.doorId);
        let speechText;

        if (result) {
            speechText = 'Okay, locking the cat flap. This might take a few moments.';
        }
        else {
            speechText = 'It appears the cat flap is already locked.';
        }

        console.log(speechText);

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();

    }
};


const UnlockRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'UnlockDoor';
    },
    async handle(handlerInput) {

        let client = new SurePetClient(Config.authToken);
        let result = await client.unlockDoor(Config.doorId);
        let speechText;

        if (result) {
            speechText = 'Okay, unlocking the cat flap. This might take a few moments.';
        }
        else {
            speechText = 'It appears the cat flap is already unlocked.';
        }

        console.log(speechText);

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};

const ToggleCurfewHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'ToggleCurfew';
    },
    async handle(handlerInput) {

        let client = new SurePetClient(Config.authToken);
        let result = await client.toggleCurfewMode(Config.doorId);
        let onOffText = result ? "on" : "off";

        let speechText = 'Done! Curfew mode is now ' + onOffText;

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();

    }
};

const LocateRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'LocatePet';
    },
    async handle(handlerInput) {

        let client = new SurePetClient(Config.authToken);
        let result = await client.getAnimalStatus(Config.petId);


        let speechText = `It looks like ${result.name} is currently ${result.position}.`;
        
        let meowSound = getMeow();
        speechText += ` <audio src='${meowSound}'/>`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();

    }
};


const DoorStatusRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'GetDoorStatus';
    },
    async handle(handlerInput) {

        let client = new SurePetClient(Config.authToken);
        let result = await client.getDeviceStatus(Config.doorId);

        let speechText = '';

        if (result.locking.mode === 4) {
            const isLocked = result.locking.curfew.locked;
            speechText = `The door is in curfew mode and is ${isLocked ? "locked" : "unlocked"}. `;

            if (isLocked) {
                speechText += `It will unlock at ${result.locking.curfew.unlock_time}.`;
            }
            else {
                speechText += `It will lock at ${result.locking.curfew.lock_time}.`;
            }

        }
        else {
            
            let lockModeText = '';

            switch (result.locking.mode)
            {
                case 0:
                    lockModeText = 'unlocked';
                    break;

                case 1:
                    lockModeText = 'locked inside only';
                    break;

                case 2:
                    lockModeText = 'locked outside only';
                    break;

                case 3:
                    lockModeText = 'locked both ways';
                    break;

                default:
                    lockModeText = 'in an unknown state';
            }

            speechText = `The door is currently ${lockModeText}.`
            
        }

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};


const TogglePetLocationHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'TogglePetLocation';
    },
    async handle(handlerInput) {
        console.log('Toggling pet location');

        let client = new SurePetClient(Config.authToken);
        const toggledResponse = await client.toggleAnimalPosition(Config.petId);

        let speechText = `Okay, I've updated the location of ${toggledResponse.name} to ${toggledResponse.newPosition}`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};


const SessionEndedHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    async handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('Sorry, there was an issue communicating with your cat flap.')
            .getResponse();
    }
};

module.exports.ExportedHandler = UnlockRequestHandler;


module.exports.handleRequest =
    Alexa.SkillBuilders
        .custom()
        .addRequestHandlers(
            LaunchRequestHandler,
            SessionEndedHandler,
            LockRequestHandler, 
            UnlockRequestHandler, 
            ToggleCurfewHandler, 
            LocateRequestHandler, 
            DoorStatusRequestHandler, 
            TogglePetLocationHandler)
        .lambda();