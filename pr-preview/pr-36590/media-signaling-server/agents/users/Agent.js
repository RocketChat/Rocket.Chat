"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMediaCallAgent = void 0;
const BasicAgent_1 = require("./BasicAgent");
const SignalProcessor_1 = require("./SignalProcessor");
const Manager_1 = require("../Manager");
class UserMediaCallAgent extends BasicAgent_1.UserBasicAgent {
    get signed() {
        return this._signed;
    }
    constructor(user, data) {
        const { callId, contractSigned, ...params } = data;
        super(user, params);
        this.contractId = data.contractId;
        this.callId = callId;
        this._signed = contractSigned ?? false;
        this.signalProcessor = new SignalProcessor_1.UserAgentSignalProcessor(this);
    }
    async processSignal(signal, call) {
        return this.signalProcessor.processSignal(signal, call);
    }
    async setRemoteDescription(sdp) {
        console.log('UserAgent.setRemoteDescription');
        await this.sendSignal({
            callId: this.callId,
            contractId: this.contractId,
            type: 'sdp',
            sdp,
        });
    }
    async getLocalDescription() {
        console.log('UserAgent.getRemoteDescription');
        const channel = await Manager_1.agentManager.getOrCreateContract(this.callId, this);
        return channel?.localDescription ?? null;
    }
    async requestOffer(params) {
        console.log('UserAgent.requestOffer');
        // #ToDo: this function may be called multiple times for the same call until an offer is provided; look into how to handle that
        await this.sendSignal({
            callId: this.callId,
            contractId: this.contractId,
            type: 'request-offer',
            ...params,
        });
    }
}
exports.UserMediaCallAgent = UserMediaCallAgent;
//# sourceMappingURL=Agent.js.map