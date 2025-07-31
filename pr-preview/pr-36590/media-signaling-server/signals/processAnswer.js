"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAnswer = processAnswer;
const models_1 = require("@rocket.chat/models");
const acknowledgeCallee_1 = require("../calls/acknowledgeCallee");
const acknowledgeCaller_1 = require("../calls/acknowledgeCaller");
const processAcceptedCall_1 = require("../calls/processAcceptedCall");
async function processAccept(call, channel) {
    const result = await models_1.MediaCalls.setActorSessionIdByIdAndRole(call._id, channel.participant.sessionId, channel.role);
    if (!result.modifiedCount) {
        // If nothing changed, the call already had a sessionId for this actor
        return;
    }
    // With session decided for this actor, let's try to move the call state to 'accepted'. This will only work if the other actor also has an assigned session
    const stateResult = await models_1.MediaCalls.acceptCallById(call._id);
    if (!stateResult.modifiedCount) {
        return;
    }
    // #ToDo: notify client if this throws any error
    return (0, processAcceptedCall_1.processAcceptedCall)(call._id);
}
async function processACK(call, channel) {
    if (channel.role === 'callee') {
        return (0, acknowledgeCallee_1.acknowledgeCallee)(call, channel);
    }
    return (0, acknowledgeCaller_1.acknowledgeCaller)(call, channel);
}
async function processAnswer(params, call, channel) {
    console.log('processAnswer');
    switch (params.answer) {
        case 'ack':
            return processACK(call, channel);
        case 'accept':
            return processAccept(call, channel);
        case 'unavailable':
            break;
        case 'reject':
            break;
    }
}
//# sourceMappingURL=processAnswer.js.map