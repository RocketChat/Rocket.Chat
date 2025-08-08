"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSignal = processSignal;
const models_1 = require("@rocket.chat/models");
const AgentFactory_1 = require("./agents/users/AgentFactory");
const logger_1 = require("./logger");
const processNewCallSignal_1 = require("./processNewCallSignal");
async function processSignal(signal, uid) {
    logger_1.logger.debug({ msg: 'processSignal', signal, uid });
    if (signal.type === 'request-call') {
        return (0, processNewCallSignal_1.processNewCallSignal)(signal, uid);
    }
    try {
        const call = await models_1.MediaCalls.findOneById(signal.callId);
        if (!call) {
            logger_1.logger.error({ msg: 'call not found', method: 'processSignal', signal });
            throw new Error('invalid-call');
        }
        const isCaller = call.caller.type === 'user' && call.caller.id === uid;
        const isCallee = call.callee.type === 'user' && call.callee.id === uid;
        if (!isCaller && !isCallee) {
            logger_1.logger.error({ msg: 'actor is not part of the call', method: 'processSignal', signal });
            throw new Error('invalid-call');
        }
        // Ignore signals from different sessions
        if (isCaller && call.caller.contractId && call.caller.contractId !== signal.contractId) {
            return;
        }
        if (isCallee && call.callee.contractId && call.callee.contractId !== signal.contractId) {
            return;
        }
        const factory = await AgentFactory_1.UserAgentFactory.getAgentFactoryForUser(uid, signal.contractId);
        const agent = factory?.getCallAgent(call);
        if (!agent) {
            logger_1.logger.error({ msg: 'agent not found', method: 'processSignal', signal });
            throw new Error('invalid-call');
        }
        await agent.processSignal(signal, call);
    }
    catch (e) {
        logger_1.logger.error(e);
        throw e;
    }
}
//# sourceMappingURL=processSignal.js.map