let config = {

    authToken: process.env["auth_token"] || "", // Put auth token here for testing locally
    
    petId: process.env["pet_id"] || "",
    doorId: process.env["door_id"] || ""
};

module.exports = config;