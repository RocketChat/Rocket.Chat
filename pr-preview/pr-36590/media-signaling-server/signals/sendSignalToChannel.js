"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSignalToChannel = sendSignalToChannel;
const isValidSignalRole_1 = require("./isValidSignalRole");
const signalHandler_1 = require("./signalHandler");
const logger_1 = require("../utils/logger");
async function sendSignalToChannel(channel, signal) {
    if (!(0, isValidSignalRole_1.isValidSignalRole)(channel.role)) {
        logger_1.logger.info({ msg: 'tried to send a signal to a channel with invalid role', channel, signal });
        return;
    }
    logger_1.logger.debug({ msg: 'sending signal to channel', channel, signal });
    await (0, signalHandler_1.sendSignal)(channel.participant.id, {
        callId: channel.callId,
        sessionId: channel.participant.sessionId,
        ...signal,
    });
}
//# sourceMappingURL=sendSignalToChannel.js.map