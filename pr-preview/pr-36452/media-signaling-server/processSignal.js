"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSignal = processSignal;
const models_1 = require("@rocket.chat/models");
const AgentFactory_1 = require("./agents/users/AgentFactory");
const createCall_1 = require("./createCall");
const mutateCallee_1 = require("./mutateCallee");
async function processSignal(signal, uid) {
    console.log('server.processSignal', signal, uid);
    try {
        const call = await models_1.MediaCalls.findOneById(signal.callId);
        if (!call) {
            if (signal.type === 'request-call') {
                console.log('creating call as requested');
                await (0, createCall_1.createCall)({ type: 'user', id: uid, contractId: signal.contractId }, await (0, mutateCallee_1.mutateCallee)(signal.callee), signal.callId);
                return;
            }
            console.log('call not found', signal.type);
            throw new Error('invalid-call');
        }
        if (signal.type === 'request-call') {
            console.log('call found');
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