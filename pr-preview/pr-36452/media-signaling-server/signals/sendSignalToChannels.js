"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSignalToChannels = sendSignalToChannels;
const sendSignalToChannel_1 = require("./sendSignalToChannel");
async function sendSignalToChannels(channel, signal) {
    await Promise.all(channel.map((channel) => (0, sendSignalToChannel_1.sendSignalToChannel)(channel, signal)));
}
//# sourceMappingURL=sendSignalToChannels.js.map