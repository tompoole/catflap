const SurePetClient = require('./surepet_client');
const Config = require('./config');
const Alexa = require('./alexa');

(async () => {
    try {
    let client = new SurePetClient(Config.authToken);
    let status = await client.getDeviceStatus(Config.doorId);

    console.log(status);

    await Alexa.ExportedHandler.handle({});

    } catch (e) {
        console.error(e);
    }
})();
