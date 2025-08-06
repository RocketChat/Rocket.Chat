"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCall = createCall;
const models_1 = require("@rocket.chat/models");
const Manager_1 = require("./agents/Manager");
async function createCall(caller, callee) {
    // The caller must always have a contract to create the call
    if (!caller.contractId) {
        throw new Error('invalid-caller');
    }
    const callerAgent = await Manager_1.agentManager.getNewAgentForActor(caller, 'caller');
    if (!callerAgent) {
        throw new Error('invalid-caller');
    }
    const calleeAgent = await Manager_1.agentManager.getNewAgentForActor(callee, 'callee');
    if (!calleeAgent) {
        throw new Error('invalid-callee');
    }
    const call = {
        service: 'webrtc',
        kind: 'direct',
        state: 'none',
        createdBy: caller,
        createdAt: new Date(),
        caller,
        callee,
    };
    const insertResult = await models_1.MediaCalls.insertOne(call);
    if (!insertResult.insertedId) {
        throw new Error('failed-to-create-call');
    }
    const newCall = await models_1.MediaCalls.findOneById(insertResult.insertedId);
    if (!newCall) {
        throw new Error('failed-to-create-call');
    }
    await callerAgent.onNewCall(newCall, calleeAgent);
    await calleeAgent.onNewCall(newCall, callerAgent);
    return newCall;
}
//# sourceMappingURL=createCall.js.map