"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestChannelOffer = requestChannelOffer;
const sendSignalToChannel_1 = require("../signals/sendSignalToChannel");
const validateChannelForSignals_1 = require("../signals/validateChannelForSignals");
async function requestChannelOffer(channel, params) {
    // If the channel already has a local Sdp, no need to request its offer unless we're restarting ICE
    if (channel.localDescription?.sdp && !params.iceRestart) {
        return;
    }
    (0, validateChannelForSignals_1.validateChannelForSignals)(channel);
    await (0, sendSignalToChannel_1.sendSignalToChannel)(channel, {
        type: 'request-offer',
        body: params,
    });
}
//# sourceMappingURL=requestChannelOffer.js.map