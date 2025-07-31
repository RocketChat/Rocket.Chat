"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acknowledgeCaller = acknowledgeCaller;
const requestChannelOffer_1 = require("../channels/requestChannelOffer");
const compareParticipantAndActor_1 = require("../utils/compareParticipantAndActor");
async function acknowledgeCaller(call, channel) {
    // If we're not the caller, or we are a different caller session than the one where the call was started, do nothing
    if (!(0, compareParticipantAndActor_1.compareParticipantAndActor)(channel.participant, call.caller)) {
        return;
    }
    if (call.caller.type === 'user' && call.caller.sessionId) {
        await (0, requestChannelOffer_1.requestChannelOffer)(channel, {});
    }
}
//# sourceMappingURL=acknowledgeCaller.js.map