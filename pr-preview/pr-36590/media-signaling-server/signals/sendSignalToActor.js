"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSignalToActor = sendSignalToActor;
const signalHandler_1 = require("./signalHandler");
const logger_1 = require("../utils/logger");
async function sendSignalToActor(actor, signal) {
    if (actor.type !== 'user') {
        return;
    }
    logger_1.logger.debug({ msg: 'sending signal to actor', actor, signal });
    await (0, signalHandler_1.sendSignal)(actor.id, {
        ...('sessionId' in actor && { sessionId: actor.sessionId }),
        ...signal,
    });
}
//# sourceMappingURL=sendSignalToActor.js.map