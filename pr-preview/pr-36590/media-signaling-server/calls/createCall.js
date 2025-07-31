"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCall = createCall;
const models_1 = require("@rocket.chat/models");
const createInitialChannel_1 = require("../channels/createInitialChannel");
const sendNewSignals_1 = require("../signals/sendNewSignals");
const mapUserToContactInformation_1 = require("../utils/mapUserToContactInformation");
async function createCall(caller, callee) {
    if (caller.type !== 'user' || callee.type !== 'user') {
        throw new Error('not-implemented');
    }
    if (!caller.sessionId) {
        throw new Error('not-implemented');
    }
    const callerUser = await models_1.Users.findOneById(caller.id, {
        projection: { username: 1, name: 1, freeSwitchExtension: 1 },
    });
    if (!callerUser?.username) {
        throw new Error('invalid-caller');
    }
    const calleeUser = await models_1.Users.findOneById(callee.id, {
        projection: { username: 1, name: 1, freeSwitchExtension: 1 },
    });
    if (!calleeUser?.username) {
        throw new Error('invalid-callee');
    }
    const call = {
        service: 'webrtc',
        kind: 'direct',
        state: 'none',
        createdBy: caller,
        createdAt: new Date(),
        caller: {
            ...caller,
            ...(0, mapUserToContactInformation_1.mapUserToContactInformation)(callerUser),
        },
        callee: {
            ...callee,
            ...(0, mapUserToContactInformation_1.mapUserToContactInformation)(calleeUser),
        },
    };
    const insertResult = await models_1.MediaCalls.insertOne(call);
    if (!insertResult.insertedId) {
        throw new Error('failed-to-create-call');
    }
    await Promise.allSettled([
        (0, createInitialChannel_1.createInitialChannel)(insertResult.insertedId, caller, { role: 'caller' }, callerUser),
        (0, createInitialChannel_1.createInitialChannel)(insertResult.insertedId, callee, { role: 'callee' }, calleeUser),
    ]);
    return (0, sendNewSignals_1.sendNewSignals)(insertResult.insertedId);
}
//# sourceMappingURL=createCall.js.map