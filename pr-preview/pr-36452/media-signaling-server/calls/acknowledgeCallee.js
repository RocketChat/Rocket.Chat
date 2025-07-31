"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acknowledgeCallee = acknowledgeCallee;
const models_1 = require("@rocket.chat/models");
const compareParticipantAndActor_1 = require("../utils/compareParticipantAndActor");
async function acknowledgeCallee(call, channel) {
    // If we're not the callee, or we are a different callee session than the one where the call was accepted, do nothing
    if (!(0, compareParticipantAndActor_1.compareParticipantAndActor)(channel.participant, call.callee)) {
        return;
    }
    // Change the call state from 'none' to 'ringing' when any callee session is found
    await models_1.MediaCalls.startRingingById(call._id);
}
//# sourceMappingURL=acknowledgeCallee.js.map