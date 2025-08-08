"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMediaCallAgent = void 0;
const BasicAgent_1 = require("./BasicAgent");
const SignalProcessor_1 = require("./SignalProcessor");
const logger_1 = require("../../logger");
const Manager_1 = require("../Manager");
class UserMediaCallAgent extends BasicAgent_1.UserBasicAgent {
    get signed() {
        return this.contractState === 'signed';
    }
    get ignored() {
        return this.contractState === 'ignored';
    }
    constructor(user, data) {
        const { callId, contractState, ...params } = data;
        super(user, params);
        this.contractId = data.contractId;
        this.callId = callId;
        this.contractState = (this.contractId && contractState) || 'proposed';
        this.signalProcessor = new SignalProcessor_1.UserAgentSignalProcessor(this);
    }
    async processSignal(signal, call) {
        return this.signalProcessor.processSignal(signal, call);
    }
    async setRemoteDescription(sdp) {
        logger_1.logger.debug({ msg: 'UserMediaCallAgent.setRemoteDescription', sdp });
        await this.sendSignal({
            callId: this.callId,
            toContractId: this.contractId,
            type: 'remote-sdp',
            sdp,
        });
    }
    async getLocalDescription() {
        logger_1.logger.debug({ msg: 'UserMediaCallAgent.getRemoteDescription' });
        const channel = await Manager_1.agentManager.getOrCreateContract(this.callId, this);
        return channel?.localDescription ?? null;
    }
    async requestOffer(params) {
        logger_1.logger.debug({ msg: 'UserMediaCallAgent.requestOffer', params, actor: this.actor, contractState: this.contractState });
        // #ToDo: this function may be called multiple times for the same call until an offer is provided; maybe consider the channel state before sending the offer
        await this.sendSignal({
            callId: this.callId,
            toContractId: this.contractId,
            type: 'request-offer',
            ...params,
        });
    }
    async notify(callId, notification, signedContractId) {
        // If we have been ignored, we should not be notifying anyone
        if (this.ignored) {
            return;
        }
        // If we know we're signed, inject our contractId into all notifications we send to the client
        const signedId = signedContractId || (this.signed && this.contractId) || undefined;
        return super.notify(callId, notification, signedId);
    }
    async sign() {
        if (this.contractState !== 'proposed') {
            throw new Error(`Can't sign a contract that is not pending.`);
        }
        this.contractState = 'signed';
    }
}
exports.UserMediaCallAgent = UserMediaCallAgent;
//# sourceMappingURL=Agent.js.map