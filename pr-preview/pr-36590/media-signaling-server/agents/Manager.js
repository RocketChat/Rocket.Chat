"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentManager = void 0;
const models_1 = require("@rocket.chat/models");
const AgentFactory_1 = require("./users/AgentFactory");
class MediaCallAgentManager {
    async getAgentFactoryForActor(actor) {
        console.log('AgentManager.getAgentFactoryForActor');
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
        console.log('AgentManager.getOrCreateContract');
        const { role, actorType, actorId, contractId } = agent;
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
        console.log('AgentManager.hangupCall');
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
        console.log('AgentManager.acknowledgeCallee');
        if (agent.role !== 'callee') {
            return;
        }
        await models_1.MediaCalls.startRingingById(agent.callId);
    }
    async acceptCall(agent) {
        console.log('AgentManager.acceptCall');
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
        console.log('agentManager.setLocalDescription');
        const otherAgent = await this.getOppositeAgent(agent);
        if (!otherAgent) {
            console.log('otherAgent not found');
            return;
        }
        otherAgent.setRemoteDescription(sdp);
    }
    async getOppositeAgentFactory(call, agent) {
        console.log('AgentManager.getOppositeAgentFactory');
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
        console.log('AgentManager.getOppositeAgent');
        const call = await models_1.MediaCalls.findOneById(agent.callId);
        if (!call) {
            return null;
        }
        return this.getCallAgent(() => this.getOppositeAgentFactory(call, agent), call);
    }
    async getAnyOppositeAgent(agent) {
        console.log('AgentManager.getAnyOppositeAgent');
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
        console.log('AgentManager.hangupByServer');
        // , errorType?: 'signaling' | 'service' | 'media'
        // const hangupReason = errorType ? `${errorType}-error` : 'error';
        const endedBy = { type: 'server', id: 'server' };
        const stateResult = await models_1.MediaCalls.hangupCallById(callId, { endedBy, reason: serverErrorCode });
        const result = Boolean(stateResult.modifiedCount);
        if (result && agentsToNotify) {
            await Promise.allSettled(agentsToNotify.map((agent) => agent.notify(callId, 'hangup')));
        }
        return result;
    }
    hangupAndThrow(callId, error, agents) {
        console.log('AgentManager.hangupAndThrow');
        this.shieldPromise(this.hangupByServer(callId, error, agents));
        throw new Error(error);
    }
    shieldPromise(promiseOrFn) {
        const promise = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
        void promise.catch(() => null);
    }
    async notifyAll(agents, callId, notification) {
        console.log('AgentManager.notifyAll');
        await Promise.all(agents.map((agent) => agent.notify(callId, notification)));
    }
    async processAcceptedCall(calleeAgent) {
        console.log('AgentManager.processAcceptedCall');
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
            console.log('caller sdp is not an offer');
            // logger.error({ msg: 'The local description of a caller channel is not an offer', local: offer });
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