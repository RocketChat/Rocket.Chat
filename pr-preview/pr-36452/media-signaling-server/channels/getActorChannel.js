"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActorChannel = getActorChannel;
const models_1 = require("@rocket.chat/models");
async function getActorChannel(callId, actor) {
    if (actor.type !== 'user') {
        throw new Error('not-implemented');
    }
    // If there is no sessionId yet, we can't determine which channel is going to be used by this actor
    if (!actor.sessionId) {
        return null;
    }
    return models_1.MediaCallChannels.findOneByCallIdAndParticipant(callId, actor);
}
//# sourceMappingURL=getActorChannel.js.map