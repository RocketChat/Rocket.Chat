"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSDP = processSDP;
const models_1 = require("@rocket.chat/models");
const deliverChannelSDP_1 = require("../channels/deliverChannelSDP");
const getOppositeChannel_1 = require("../channels/getOppositeChannel");
async function processSDP(params, call, channel) {
    console.log('processSDP');
    // Save the SDP for the local session of the channel
    await models_1.MediaCallChannels.setLocalDescription(channel._id, params.sdp);
    // Find the opposite channel and send them the SDP as remote
    const otherChannel = await (0, getOppositeChannel_1.getOppositeChannel)(call, channel);
    // otherChannel will only be defined if the other participant has already accepted the call
    if (otherChannel) {
        await (0, deliverChannelSDP_1.deliverChannelSDP)(otherChannel, params);
    }
}
//# sourceMappingURL=processSDP.js.map