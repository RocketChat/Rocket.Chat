import type { IMediaCall, IMediaCallChannel, MediaCallActor, ServerActor } from '@rocket.chat/core-typings';
import type { CallHangupReason, CallRole, CallNotification } from '@rocket.chat/media-signaling';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { MediaCallChannels, MediaCalls } from '@rocket.chat/models';

import type { IMediaCallAgent, IMediaCallAgentFactory, IMediaCallBasicAgent, INewMediaCallAgent } from './definition/IMediaCallAgent';
import { UserAgentFactory } from './users/AgentFactory';

type FactoryFn = () => Promise<IMediaCallAgentFactory | null>;

class MediaCallAgentManager {
	public async getAgentFactoryForActor(actor: MediaCallActor): Promise<IMediaCallAgentFactory | null> {
		console.log('AgentManager.getAgentFactoryForActor');
		if (actor.type === 'user') {
			return UserAgentFactory.getAgentFactoryForActor(actor);
		}

		if (actor.type === 'sip') {
			return null;
		}

		return null;
	}

	public async getNewAgentForActor(actor: MediaCallActor, role: CallRole): Promise<INewMediaCallAgent | null> {
		return this.getNewAgent(() => this.getAgentFactoryForActor(actor), role);
	}

	public async getAgentForCallActor(call: IMediaCall, actor: MediaCallActor): Promise<IMediaCallAgent | null> {
		return this.getCallAgent(() => this.getAgentFactoryForActor(actor), call);
	}

	public getRoleForCallActor(call: IMediaCall, actor: Pick<MediaCallActor, 'type' | 'id'>): CallRole | null {
		if (call.callee.type === actor.type && call.callee.id === actor.id) {
			return 'callee';
		}

		if (call.caller.type === actor.type && call.caller.id === actor.id) {
			return 'caller';
		}

		return null;
	}

	public async getOrCreateContract(
		callId: string,
		agent: IMediaCallBasicAgent,
		params?: Pick<IMediaCallChannel, 'acknowledged'>,
	): Promise<IMediaCallChannel> {
		console.log('AgentManager.getOrCreateContract');
		const { role, actorType, actorId, contractId } = agent;
		if (!contractId) {
			throw new Error('error-invalid-contract');
		}

		const contact = await agent.getContactInfo();

		const newChannel: InsertionModel<IMediaCallChannel> = {
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
		const insertedChannel = await MediaCallChannels.createOrUpdateChannel(newChannel);
		if (!insertedChannel) {
			throw new Error('failed-to-insert-channel');
		}

		// This shouldn't be possible unless something tried to switch the roles of the call's actors
		if (insertedChannel.role !== role) {
			throw new Error('invalid-channel-data');
		}

		return insertedChannel;
	}

	public async hangupCall(agent: IMediaCallAgent, reason: CallHangupReason): Promise<void> {
		console.log('AgentManager.hangupCall');
		const endedBy = agent.actor;

		const stateResult = await MediaCalls.hangupCallById(agent.callId, { endedBy, reason });
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

	public async acknowledgeCallee(agent: IMediaCallAgent): Promise<void> {
		console.log('AgentManager.acknowledgeCallee');
		if (agent.role !== 'callee') {
			return;
		}

		await MediaCalls.startRingingById(agent.callId);
	}

	public async acceptCall(agent: IMediaCallAgent): Promise<void> {
		console.log('AgentManager.acceptCall');
		if (agent.role !== 'callee') {
			return;
		}

		const stateResult = await MediaCalls.acceptCallById(agent.callId, agent.contractId);
		// If nothing changed, the call was no longer ringing
		if (!stateResult.modifiedCount) {
			// Notify something?
			return;
		}

		// #ToDo: notify client if this throws any error
		return this.processAcceptedCall(agent);
	}

	public async setLocalDescription(agent: IMediaCallAgent, sdp: RTCSessionDescriptionInit): Promise<void> {
		console.log('agentManager.setLocalDescription');
		const otherAgent = await this.getOppositeAgent(agent);
		if (!otherAgent) {
			console.log('otherAgent not found');
			return;
		}

		otherAgent.setRemoteDescription(sdp);
	}

	private async getOppositeAgentFactory(call: IMediaCall, agent: IMediaCallAgent): Promise<IMediaCallAgentFactory | null> {
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
	private async getOppositeAgent(agent: IMediaCallAgent): Promise<IMediaCallAgent | null> {
		console.log('AgentManager.getOppositeAgent');
		const call = await MediaCalls.findOneById(agent.callId);
		if (!call) {
			return null;
		}

		return this.getCallAgent(() => this.getOppositeAgentFactory(call, agent), call);
	}

	private async getAnyOppositeAgent(agent: IMediaCallAgent): Promise<IMediaCallBasicAgent | null> {
		console.log('AgentManager.getAnyOppositeAgent');
		const call = await MediaCalls.findOneById(agent.callId);
		if (!call) {
			return null;
		}

		const factory = await this.getOppositeAgentFactory(call, agent);
		if (!factory) {
			return null;
		}

		return factory.getCallAgent(call) || factory.getNewAgent(agent.oppositeRole);
	}

	private async hangupByServer(callId: string, serverErrorCode: string, agentsToNotify?: IMediaCallBasicAgent[]): Promise<boolean> {
		console.log('AgentManager.hangupByServer');
		// , errorType?: 'signaling' | 'service' | 'media'
		// const hangupReason = errorType ? `${errorType}-error` : 'error';

		const endedBy = { type: 'server', id: 'server' } as ServerActor;

		const stateResult = await MediaCalls.hangupCallById(callId, { endedBy, reason: serverErrorCode });
		const result = Boolean(stateResult.modifiedCount);

		if (result && agentsToNotify) {
			await Promise.allSettled(agentsToNotify.map((agent) => agent.notify(callId, 'hangup')));
		}

		return result;
	}

	private hangupAndThrow(callId: string, error: string, agents?: IMediaCallBasicAgent[]): never {
		console.log('AgentManager.hangupAndThrow');
		this.shieldPromise(this.hangupByServer(callId, error, agents));

		throw new Error(error);
	}

	private shieldPromise(promiseOrFn: Promise<any> | (() => Promise<any>)): void {
		const promise = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
		void promise.catch(() => null);
	}

	private async notifyAll(agents: IMediaCallBasicAgent[], callId: string, notification: CallNotification): Promise<void> {
		console.log('AgentManager.notifyAll');
		await Promise.all(agents.map((agent) => agent.notify(callId, notification)));
	}

	private async processAcceptedCall(calleeAgent: IMediaCallAgent): Promise<void> {
		console.log('AgentManager.processAcceptedCall');
		const { callId } = calleeAgent;

		const call = await MediaCalls.findOneById(callId);
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

	private async getNewAgent(
		factoryFn: FactoryFn,
		...params: Parameters<IMediaCallAgentFactory['getNewAgent']>
	): Promise<INewMediaCallAgent | null> {
		return (await factoryFn())?.getNewAgent(...params) ?? null;
	}

	private async getCallAgent(
		factoryFn: FactoryFn,
		...params: Parameters<IMediaCallAgentFactory['getCallAgent']>
	): Promise<IMediaCallAgent | null> {
		return (await factoryFn())?.getCallAgent(...params) ?? null;
	}
}

export const agentManager = new MediaCallAgentManager();
