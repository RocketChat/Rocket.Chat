"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processEndedCall = processEndedCall;
const sendSignalToAllActors_1 = require("../signals/sendSignalToAllActors");
async function processEndedCall(call) {
    await (0, sendSignalToAllActors_1.sendSignalToAllActors)(call, {
        type: 'notification',
        body: {
            notification: 'hangup',
        },
    });
}
//# sourceMappingURL=processEndedCall.js.map