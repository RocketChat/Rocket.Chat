"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCall = createCall;
const models_1 = require("@rocket.chat/models");
const Manager_1 = require("./agents/Manager");
async function createCall(params) {
    console.log('createCall', params);
    const { caller, callee, requestedCallId, requestedService } = params;
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
    const service = requestedService || 'webrtc';
    // webrtc is our only known service right now, but if the call was requested by a client that doesn't also implement it, we don't need to even create a call
    if (service !== 'webrtc') {
        throw new Error('invalid-call-service');
    }
    const call = {
        service,
        kind: 'direct',
        state: 'none',
        createdBy: caller,
        createdAt: new Date(),
        caller,
        callee,
        ...(requestedCallId && { callerRequestedId: requestedCallId }),
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