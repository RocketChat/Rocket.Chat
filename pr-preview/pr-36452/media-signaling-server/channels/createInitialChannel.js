"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialChannel = createInitialChannel;
const models_1 = require("@rocket.chat/models");
async function createInitialChannel(callId, actor, channelData, userData) {
    // Rocket.Chat users will have a separate channel entry for each session involved in the call
    // So if we don't have the sessionId of an user yet, do not initialize the channel
    if (actor.type !== 'user' || !actor.sessionId) {
        return;
    }
    if (!userData?.username || !userData.name) {
        return;
    }
    await models_1.MediaCallChannels.insertOne({
        ...channelData,
        callId,
        participant: {
            type: 'user',
            id: userData._id,
            username: userData.username,
            displayName: userData.name,
            sessionId: actor.sessionId,
        },
        state: 'none',
        joinedAt: new Date(),
        acknowledged: false,
    });
}
//# sourceMappingURL=createInitialChannel.js.map