"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateChannelForSignals = validateChannelForSignals;
function validateChannelForSignals(channel) {
    if (channel.participant.type !== 'user') {
        throw new Error('not-implemented');
    }
    if (!channel.participant.sessionId) {
        throw new Error('SDP may only be sent to specific user sessions.');
    }
}
//# sourceMappingURL=validateChannelForSignals.js.map