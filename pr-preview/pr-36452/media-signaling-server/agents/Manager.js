"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentManager = void 0;
const models_1 = require("@rocket.chat/models");
const logger_1 = require("../logger");
const AgentFactory_1 = require("./users/AgentFactory");
class MediaCallAgentManager {
    async getAgentFactoryForActor(actor) {
        logger_1.logger.debug({ msg: 'AgentManager.getAgentFactoryForActor', actor });
        if (actor.type === 'user') {
            return AgentFactory_1.UserAgentFactory.getAgentFactoryForActor(actor);
        }
        if (actor.type === 'sip') {
            return null;
        }
        return null;
    }
    async getNewAgentForActor(actor, role) {
        return this.getNewAgent(() => this.getAgentFactoryForActor(actor), role);
    }
    async getAgentForCallActor(call, actor) {
        return this.getCallAgent(() => this.getAgentFactoryForActor(actor), call);
    }
    getRoleForCallActor(call, actor) {
        if (call.callee.type === actor.type && call.callee.id === actor.id) {
            return 'callee';
        }
        if (call.caller.type === actor.type && call.caller.id === actor.id) {
            return 'caller';
        }
        return null;
    }
    async getOrCreateContract(callId, agent, params) {
        const { role, actorType, actorId, contractId } = agent;
        logger_1.logger.debug({ msg: 'AgentManager.getOrCreateContract', callId, params, role, actorType, actorId, contractId });
        if (!contractId) {
            throw new Error('error-invalid-contract');
        }
        const contact = await agent.getContactInfo();
        const newChannel = {
            callId,
            state: 'none',
            role,
            acknowledged: Boolean(params?.acknowledged) ?? false,
            contact,
            contractId,
            actorType,
            actorId,
        };
        // Create this channel if it doesn't yet exist, or update ack if it does and needs it
        const insertedChannel = await models_1.MediaCallChannels.createOrUpdateChannel(newChannel);
        if (!insertedChannel) {
            throw new Error('failed-to-insert-channel');
        }
        // This shouldn't be possible unless something tried to switch the roles of the call's actors
        if (insertedChannel.role !== role) {
            throw new Error('invalid-channel-data');
        }
        return insertedChannel;
    }
    async hangupCall(agent, reason) {
        logger_1.logger.debug({ msg: 'AgentManager.hangupCall', reason, actor: agent.actor });
        const endedBy = agent.actor;
        const stateResult = await models_1.MediaCalls.hangupCallById(agent.callId, { endedBy, reason });
        if (!stateResult.modifiedCount) {
            return;
        }
        agent.notify(agent.callId, 'hangup');
        const otherAgent = await this.getAnyOppositeAgent(agent);
        // #ToDo: log something if the otherAgent is not found
        if (otherAgent) {
            otherAgent.notify(agent.callId, 'hangup');
        }
    }
    async acknowledgeCallee(agent) {
        logger_1.logger.debug({ msg: 'AgentManager.acknowledgeCallee', actor: agent.actor });
        if (agent.role !== 'callee') {
            return;
        }
        await models_1.MediaCalls.startRingingById(agent.callId);
    }
    async acceptCall(agent) {
        logger_1.logger.debug({ msg: 'AgentManager.acceptCall', actor: agent.actor });
        if (agent.role !== 'callee') {
            return;
        }
        const stateResult = await models_1.MediaCalls.acceptCallById(agent.callId, agent.contractId);
        // If nothing changed, the call was no longer ringing
        if (!stateResult.modifiedCount) {
            // Notify something?
            return;
        }
        // #ToDo: notify client if this throws any error
        return this.processAcceptedCall(agent);
    }
    async setLocalDescription(agent, sdp) {
        logger_1.logger.debug({ msg: 'AgentManager.setLocalDescription', actor: agent.actor, sdp });
        const otherAgent = await this.getOppositeAgent(agent);
        if (!otherAgent) {
            logger_1.logger.debug({ msg: 'Opposite agent not found', method: 'AgentManager.setLocalDescription', role: agent.role, actor: agent.actor });
            return;
        }
        otherAgent.setRemoteDescription(sdp);
    }
    async getOppositeAgentFactory(call, agent) {
        logger_1.logger.debug({ msg: 'AgentManager.getOppositeAgentFactory', actor: agent.actor });
        switch (agent.role) {
            case 'caller':
                return this.getAgentFactoryForActor(call.callee);
            case 'callee':
                return this.getAgentFactoryForActor(call.caller);
            default:
                return null;
        }
    }
    // This will only return an agent if a contract for the other role has already been signed
    async getOppositeAgent(agent) {
        logger_1.logger.debug({ msg: 'AgentManager.getOppositeAgent', actor: agent.actor });
        const call = await models_1.MediaCalls.findOneById(agent.callId);
        if (!call) {
            logger_1.logger.debug({ msg: 'call not found', method: 'AgentManager.getOppositeAgent' });
            return null;
        }
        return this.getCallAgent(() => this.getOppositeAgentFactory(call, agent), call);
    }
    async getAnyOppositeAgent(agent) {
        logger_1.logger.debug({ msg: 'AgentManager.getAnyOppositeAgent', actor: agent.actor });
        const call = await models_1.MediaCalls.findOneById(agent.callId);
        if (!call) {
            return null;
        }
        const factory = await this.getOppositeAgentFactory(call, agent);
        if (!factory) {
            return null;
        }
        return factory.getCallAgent(call) || factory.getNewAgent(agent.oppositeRole);
    }
    async hangupByServer(callId, serverErrorCode, agentsToNotify) {
        logger_1.logger.debug({ msg: 'AgentManager.hangupByServer', callId, serverErrorCode });
        const endedBy = { type: 'server', id: 'server' };
        const stateResult = await models_1.MediaCalls.hangupCallById(callId, { endedBy, reason: serverErrorCode });
        const result = Boolean(stateResult.modifiedCount);
        if (result && agentsToNotify) {
            await Promise.allSettled(agentsToNotify.map((agent) => agent.notify(callId, 'hangup')));
        }
        return result;
    }
    hangupAndThrow(callId, error, agents) {
        logger_1.logger.debug({ msg: 'AgentManager.hangupAndThrow', callId, error });
        this.shieldPromise(this.hangupByServer(callId, error, agents));
        throw new Error(error);
    }
    shieldPromise(promiseOrFn) {
        const promise = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
        void promise.catch(() => null);
    }
    async notifyAll(agents, callId, notification) {
        logger_1.logger.debug({ msg: 'AgentManager.notifyAll', callId, notification });
        await Promise.all(agents.map((agent) => agent.notify(callId, notification)));
    }
    async processAcceptedCall(calleeAgent) {
        logger_1.logger.debug({ msg: 'AgentManager.processAcceptedCall', callee: calleeAgent.actor });
        const { callId } = calleeAgent;
        const call = await models_1.MediaCalls.findOneById(callId);
        if (!call) {
            throw new Error('error-failed-to-accept-call');
        }
        const callerAgent = await this.getAgentForCallActor(call, call.caller);
        if (!callerAgent) {
            this.hangupAndThrow(callId, 'unable-to-identify-caller-agent', [calleeAgent]);
        }
        // We send the accepted notification immediately to report on the call state
        await this.notifyAll([calleeAgent, callerAgent], callId, 'accepted');
        const offer = await callerAgent.getLocalDescription();
        if (!offer) {
            await callerAgent.requestOffer({});
            return;
        }
        // #ToDo: handle cases where an actor's service role doesn't match the call role
        if (offer.type !== 'offer') {
            logger_1.logger.warn({ msg: 'caller sdp is not an offer', local: offer });
            throw new Error('unexpected-state');
        }
        calleeAgent.setRemoteDescription(offer);
    }
    async getNewAgent(factoryFn, ...params) {
        return (await factoryFn())?.getNewAgent(...params) ?? null;
    }
    async getCallAgent(factoryFn, ...params) {
        return (await factoryFn())?.getCallAgent(...params) ?? null;
    }
}
exports.agentManager = new MediaCallAgentManager();
//# sourceMappingURL=Manager.js.map