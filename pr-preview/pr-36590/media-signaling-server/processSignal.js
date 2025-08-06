"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSignal = processSignal;
const models_1 = require("@rocket.chat/models");
const AgentFactory_1 = require("./agents/users/AgentFactory");
async function processSignal(signal, uid) {
    console.log('server.processSignal', signal, uid);
    try {
        const call = await models_1.MediaCalls.findOneById(signal.callId);
        if (!call) {
            throw new Error('invalid-call');
        }
        const factory = await AgentFactory_1.UserAgentFactory.getAgentFactoryForUser(uid, signal.contractId);
        const agent = factory?.getCallAgent(call);
        if (!agent) {
            throw new Error('invalid-call');
        }
        await agent.processSignal(signal, call);
    }
    catch (e) {
        console.log(e);
        throw e;
    }
}
//# sourceMappingURL=processSignal.js.map