"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliverChannelSDP = deliverChannelSDP;
const sendSignalToChannel_1 = require("../signals/sendSignalToChannel");
const validateChannelForSignals_1 = require("../signals/validateChannelForSignals");
async function deliverChannelSDP(channel, body) {
    (0, validateChannelForSignals_1.validateChannelForSignals)(channel);
    await (0, sendSignalToChannel_1.sendSignalToChannel)(channel, {
        type: 'sdp',
        body,
    });
}
//# sourceMappingURL=deliverChannelSDP.js.map