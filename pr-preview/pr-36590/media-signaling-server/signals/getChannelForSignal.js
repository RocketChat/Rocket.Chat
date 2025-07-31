"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChannelForSignal = getChannelForSignal;
const models_1 = require("@rocket.chat/models");
async function getChannelForSignal(channelData) {
    console.log('getChannelForSignal', channelData.role);
    const newChannel = {
        ...channelData,
        state: 'none',
        acknowledged: true,
    };
    // Create this channel if it doesn't yet exist, or update it with ack = true if it does
    const insertedChannel = await models_1.MediaCallChannels.createOrUpdateChannel(newChannel);
    if (!insertedChannel) {
        throw new Error('failed-to-insert-channel');
    }
    return insertedChannel;
}
//# sourceMappingURL=getChannelForSignal.js.map