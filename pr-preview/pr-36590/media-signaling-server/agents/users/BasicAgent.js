"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBasicAgent = void 0;
const logger_1 = require("../../logger");
const signalHandler_1 = require("../../signalHandler");
const IMediaCallAgent_1 = require("../definition/IMediaCallAgent");
class UserBasicAgent extends IMediaCallAgent_1.MediaCallBasicAgent {
    constructor(user, data) {
        super({ type: 'user', id: user._id, ...data });
        this.user = user;
    }
    isRepresentingActor(actor) {
        return super.isRepresentingActor(actor);
    }
    async getContactInfo() {
        const { _id: id, username, name: displayName, freeSwitchExtension: sipExtension } = this.user;
        return {
            type: 'user',
            id,
            username,
            displayName,
            sipExtension,
            // avatarUrl,
            // host
        };
    }
    async notify(callId, notification) {
        logger_1.logger.debug({ msg: 'UserBasicAgent.notify', callId, notification });
        return this.sendSignal({
            callId,
            type: 'notification',
            notification,
        });
    }
    async sendSignal(signal) {
        (0, signalHandler_1.sendSignal)(this.user._id, signal);
    }
}
exports.UserBasicAgent = UserBasicAgent;
//# sourceMappingURL=BasicAgent.js.map