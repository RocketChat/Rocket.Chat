"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAgentSignalProcessor = void 0;
const models_1 = require("@rocket.chat/models");
const Manager_1 = require("../Manager");
class UserAgentSignalProcessor {
    constructor(agent) {
        this.agent = agent;
    }
    async processSignal(signal, call) {
        console.log('SignalProcessor.processSignal');
        const channel = await Manager_1.agentManager.getOrCreateContract(call._id, this.agent, { acknowledged: true });
        if (!channel) {
            throw new Error('invalid-call');
        }
        // The code will only reach this point if one of the three following conditions are true:
        // 1. the signal came from the exact user session where the caller initiated the call
        // 2. the signal came from the exact user session where the callee accepted the call
        // 2. the call has not been accepted yet and the signal came from a valid sesison from the callee
        const params = { channel, call };
        switch (signal.type) {
            case 'sdp':
                await this.saveLocalDescription(params, signal.sdp);
                break;
            case 'error':
                // #ToDo
                break;
            case 'answer':
                await this.processAnswer(params, signal.answer);
                break;
            case 'hangup':
                await Manager_1.agentManager.hangupCall(this.agent, signal.reason);
                break;
        }
    }
    async saveLocalDescription({ channel }, sdp) {
        console.log('SignalProcessor.saveLocalDescription');
        await models_1.MediaCallChannels.setLocalDescription(channel._id, sdp);
        await Manager_1.agentManager.setLocalDescription(this.agent, sdp);
    }
    async processAnswer(params, answer) {
        console.log('processAnswer');
        const { call } = params;
        switch (answer) {
            case 'ack':
                return this.processACK(params);
            case 'accept':
                return Manager_1.agentManager.acceptCall(this.agent);
            case 'unavailable':
                // return processUnavailable(call, channel);
                break;
            case 'reject':
                return this.processReject(call);
        }
    }
    async processReject(call) {
        console.log('SignalProcessor.processReject');
        if (this.agent.role !== 'callee') {
            return;
        }
        if (!['none', 'ringing'].includes(call.state)) {
            console.log('cant reject an ongoing call.');
            return;
        }
        return Manager_1.agentManager.hangupCall(this.agent, 'rejected');
    }
    async processACK({ channel }) {
        switch (this.agent.role) {
            case 'callee':
                // Change the call state from 'none' to 'ringing' when any callee session is found
                await Manager_1.agentManager.acknowledgeCallee(this.agent);
                break;
            case 'caller':
                // When the caller ack, we ask them to start creating an offer
                await this.requestChannelOffer(channel, {});
                break;
        }
    }
    async requestChannelOffer(channel, params) {
        // If the channel already has a local Sdp, no need to request its offer unless we're restarting ICE
        if (channel.localDescription?.sdp && !params.iceRestart) {
            return;
        }
        await this.agent.requestOffer(params);
    }
}
exports.UserAgentSignalProcessor = UserAgentSignalProcessor;
//# sourceMappingURL=SignalProcessor.js.map