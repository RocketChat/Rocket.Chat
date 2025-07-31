"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSignalHandler = setSignalHandler;
exports.sendSignal = sendSignal;
let handler = null;
function setSignalHandler(handlerFn) {
    handler = handlerFn;
}
async function sendSignal(toUid, signal) {
    console.log('sendSignal', toUid, signal);
    if (!handler) {
        throw new Error('media-signaling-server-not-configured');
    }
    return handler(toUid, signal);
}
//# sourceMappingURL=signalHandler.js.map