import type { IMediaCall, MediaCallActor, MediaCallActorType, MediaCallSignedActor } from '@rocket.chat/core-typings';
import type { CallContact, CallRole, CallService } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { agentManager } from '../agents/Manager';
import { MediaCallMonitor } from '../global/CallMonitor';
import { logger } from '../logger';

export type CreateCallParams = {
	caller: MediaCallSignedActor;
	callee: MediaCallActor;
	requestedCallId?: string;
	requestedService?: CallService;
};

export type CreateCallWithAgentParams = CreateCallParams & {
	actorRole: CallRole;
	oppositeContact: CallContact;
};

export abstract class BaseMediaCallProvider {
	public abstract readonly providerName: string;

	public abstract readonly supportedRoles: CallRole[];

	public abstract readonly actorType: MediaCallActorType;

	public supportsCallee(callee: MediaCallActor): boolean {
		return this.actorType === callee.type && this.supportedRoles.includes('callee');
	}

	public supportsCaller(caller: MediaCallActor): boolean {
		return this.actorType === caller.type && this.supportedRoles.includes('caller');
	}

	public supportsActors(actors: { callee: MediaCallActor; caller: MediaCallActor }): boolean {
		return this.supportsCallee(actors.callee) && this.supportsCaller(actors.caller);
	}

	/**
	 * Create a call, trusting that both actors are valid
	 */
	protected async createCallBetweenActors(params: CreateCallParams): Promise<IMediaCall> {
		logger.debug({ msg: 'BaseMediaCallProvider.createCallBetweenActors', params });
		const { caller, callee, requestedCallId, requestedService } = params;

		// The caller must always have a contract to create the call
		if (!caller.contractId) {
			throw new Error('invalid-caller');
		}

		const service = requestedService || 'webrtc';

		// webrtc is our only known service right now, but if the call was requested by a client that doesn't also implement it, we don't need to even create a call
		if (service !== 'webrtc') {
			throw new Error('invalid-call-service');
		}

		const call: Omit<IMediaCall, '_id' | '_updatedAt'> = {
			service,
			kind: 'direct',
			state: 'none',
			providerName: this.providerName,

			createdBy: caller,
			createdAt: new Date(),

			caller,
			callee,

			expiresAt: MediaCallMonitor.getNewExpirationTime(),

			...(requestedCallId && { callerRequestedId: requestedCallId }),
		};

		const insertResult = await MediaCalls.insertOne(call);
		if (!insertResult.insertedId) {
			throw new Error('failed-to-create-call');
		}

		const newCall = await MediaCalls.findOneById(insertResult.insertedId);
		if (!newCall) {
			throw new Error('failed-to-create-call');
		}

		return newCall;
	}

	/**
	 * Validates that an actor has a valid agent, calls a callback to create the call, then send the new call notification to that agent
	 */
	protected async createCallWithAgent(params: CreateCallWithAgentParams): Promise<IMediaCall> {
		const { actorRole, oppositeContact, ...callParams } = params;

		const userAgent = await agentManager.getNewAgentForActor(callParams[actorRole], actorRole);
		if (!userAgent) {
			throw new Error(`invalid-${actorRole}`);
		}

		const call = await this.createCallBetweenActors(callParams);

		await userAgent.onNewCall(call, oppositeContact);

		return call;
	}

	/**
	 * Create a call, trusting that the caller is a valid actor if the callee has an agent
	 */
	protected async createIncomingCall(params: CreateCallParams, callerContact: CallContact): Promise<IMediaCall> {
		return this.createCallWithAgent({
			actorRole: 'callee',
			oppositeContact: callerContact,
			...params,
		});
	}

	/**
	 * Create a call, trusting that the callee is a valid actor if the caller has an agent
	 */
	protected async createOutgoingCall(params: CreateCallParams, calleeContact: CallContact): Promise<IMediaCall> {
		return this.createCallWithAgent({
			actorRole: 'caller',
			oppositeContact: calleeContact,
			...params,
		});
	}
}
