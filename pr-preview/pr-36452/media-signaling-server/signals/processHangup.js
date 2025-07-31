"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processHangup = processHangup;
const models_1 = require("@rocket.chat/models");
const processEndedCall_1 = require("../calls/processEndedCall");
async function processHangup(params, call, channel) {
    console.log('processHangup');
    const actor = call[channel.role];
    const endedBy = { ...actor, ...(actor.type === 'user' && !actor.sessionId && { sessionId: channel.participant.sessionId }) };
    const { reason } = params;
    const stateResult = await models_1.MediaCalls.hangupCallById(call._id, { endedBy, reason });
    if (!stateResult.modifiedCount) {
        return;
    }
    return (0, processEndedCall_1.processEndedCall)(call);
}
//# sourceMappingURL=processHangup.js.map