"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertSignalHasSessionId = assertSignalHasSessionId;
function assertSignalHasSessionId(signal) {
    if (!signal.sessionId) {
        throw new Error('invalid-signal-session');
    }
}
//# sourceMappingURL=assertSignalHasSessionId.js.map