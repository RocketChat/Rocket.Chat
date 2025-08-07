"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hangupEveryCall = hangupEveryCall;
const models_1 = require("@rocket.chat/models");
async function hangupEveryCall(hangupReason) {
    // change every pending or active call state to 'hangup' with the specified reason
    await models_1.MediaCalls.hangupEveryCall({
        endedBy: { type: 'server', id: 'server' },
        reason: hangupReason || 'full-server-hangup',
    });
}
//# sourceMappingURL=hangupEveryCall.js.map