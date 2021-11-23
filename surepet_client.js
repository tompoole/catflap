const request = require('request-promise-native');
const dayjs = require('dayjs')
const dayjsUtc = require('dayjs/plugin/utc');
dayjs.extend(dayjsUtc);

const baseUrl = "https://app.api.surehub.io/api";

const LockingMode = {
    Unlocked: 0,
    LockedInside: 1,
    LockedOutside: 2,
    LockedBoth: 3,
    Curfew: 4
};

class SurePetClient {
    constructor(token) {
        this.token = token;   
    }

    getHeaders() {
        return {
            'Authorization': 'Bearer ' + this.token
        };
    }

    async lockDoor(doorId) {
        const currentStatus = await this.getDeviceStatus(doorId);
        const lockMode = currentStatus.locking.mode;

        console.log("Lock mode is currently " + lockMode);

        var alreadyLocked = 
            (lockMode === LockingMode.Curfew && currentStatus.locking.curfew.locked)
            || lockMode === LockingMode.LockedInside
            || lockMode === LockingMode.LockedOutside
            || lockMode === LockingMode.LockedBoth;

        if (alreadyLocked) {
            console.log("Nothing to do, already locked.");
            return false;
        }
        
        await this.updateDoorLockState(doorId, LockingMode.LockedInside);
        return true;
    }

    async unlockDoor(doorId) {
        var currentStatus = await this.getDeviceStatus(doorId);
        let currentLockMode = currentStatus.locking.mode;

        console.log("Current lock mode is " + currentLockMode);

        if (currentLockMode === LockingMode.Unlocked) {
            console.log("Already unlocked.");
            return false;
        }
        else if (currentLockMode === LockingMode.Curfew && currentStatus.locking.curfew.locked === false) {
            console.log("Already in curfew mode and unlocked");
            return false;
        }
        else if (currentLockMode === LockingMode.Curfew) {
            // await this.setCurfewMode(doorId, true);
            return true;
        }
        else {
            // await this.updateDoorLockState(doorId, LockingMode.Unlocked);
            return true;
        }
    }

    async getDeviceStatus(doorId) {
        var result = await request({
            uri: `${baseUrl}/device/${doorId}/status`,
            method: 'GET',
            headers: this.getHeaders(),
            json: true
        });

        return result.data;
    }

    async toggleCurfewMode(doorId) {
        return await this.setCurfewMode(doorId);
    }

    async setCurfewMode(doorId, enabled) {

        let controlResponse = await request({
            uri: `${baseUrl}/device/${doorId}/control`,
            method: 'GET',
            headers: this.getHeaders(),
            json: true
        });

        let curfewStatus = controlResponse.data.curfew;

        var enabledState = enabled || !curfewStatus.enabled;

        var curfewRequestBody = {
            "curfew": {
                "enabled": enabledState,
                "unlock_time": curfewStatus["unlock_time"],
                "lock_time": curfewStatus["lock_time"]
            }
        };

        await request({
            uri: `${baseUrl}/device/${doorId}/control`,
            method: 'PUT',
            headers: this.getHeaders(),
            json: true,
            body: curfewRequestBody
        });

        return enabledState;
    }

    async updateDoorLockState(doorId, lockMode) {
        await request({
            uri: `${baseUrl}/device/${doorId}/control`,
            method: 'PUT',
            headers: this.getHeaders(),
            json: true,
            body: {
                locking: lockMode
            }
        });
    }

    async getAnimalStatus(petId) {

        console.log(`Getting status for pet ${petId}.`);

        var detailsRequest = request({
            uri: `${baseUrl}/pet/${petId}`,
            method: 'GET',
            headers: this.getHeaders(),
            json: true
        });

        var statusRequest = request({
            uri: `${baseUrl}/pet/${petId}/position`,
            method: 'GET',
            headers: this.getHeaders(),
            json: true
        });

        var [detailsResponse, positionResponse] = await Promise.all([detailsRequest, statusRequest]);
        
        let positionName = positionResponse.data.where === 1 ? "Inside" : "Outside";

        return { 
            name: detailsResponse.data.name,
            position: positionName,
            positionId: positionResponse.data.where
        };
    }

    async toggleAnimalPosition(petId)
    {
        const currentStatus = await this.getAnimalStatus(petId);

        const body = {
            "where": currentStatus.positionId === 1 ? 2 : 1,
            "since": dayjs.utc().format()
        };

        const result = await request({
            uri: `${baseUrl}/pet/${petId}/position`,
            method: 'POST',
            headers: this.getHeaders(),
            json: true,
            body: body
        });

        return {
            newPosition: body.where === 1 ? "Inside" : "Outside",
            name: currentStatus.name
        };
    }

}

module.exports = SurePetClient;