import type { IMediaCall, IMediaCallNegotiation, MediaCallContact, MediaCallSignedContact, ServerActor } from '@rocket.chat/core-typings';
import type { CallHangupReason, CallRole } from '@rocket.chat/media-signaling';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { MediaCallNegotiations, MediaCalls } from '@rocket.chat/models';

import { getCastDirector, getMediaCallServer } from './injection';
import type { IMediaCallAgent } from '../definition/IMediaCallAgent';
import type { IMediaCallCastDirector } from '../definition/IMediaCallCastDirector';
import type { InternalCallParams, MediaCallHeader } from '../definition/common';
import { logger } from '../logger';

const EXPIRATION_TIME = 120000;
const EXPIRATION_CHECK_TIMEOUT = EXPIRATION_TIME + 1000;

export type CreateCallParams = InternalCallParams & {
	callerAgent: IMediaCallAgent;
	calleeAgent: IMediaCallAgent;
};

// expiration checks by call id
const scheduledExpirationChecks = new Map<string, ReturnType<typeof setTimeout>>();

class MediaCallDirector {
	public async hangup(call: IMediaCall, actorAgent: IMediaCallAgent, reason: CallHangupReason): Promise<void> {
		const { actor: endedBy } = actorAgent;
		logger.debug({ msg: 'MediaCallDirector.hangup', callId: call._id, reason, endedBy });

		const modified = await this.hangupCallById(call._id, { endedBy, reason });
		if (modified) {
			await actorAgent.onCallEnded(call._id);
			await actorAgent.oppositeAgent?.onCallEnded(call._id);
		}
	}

	public async hangupByServer(call: MediaCallHeader, serverErrorCode: string): Promise<boolean> {
		return this.hangupDetachedCall(call, { reason: serverErrorCode });
	}

	public async activate(call: IMediaCall, actorAgent: IMediaCallAgent): Promise<void> {
		logger.debug({ msg: 'MediaCallDirector.activateCall' });

		const stateResult = await MediaCalls.activateCallById(call._id, this.getNewExpirationTime());
		if (!stateResult.modifiedCount) {
			return;
		}

		logger.info({ msg: 'Call was flagged as active', callId: call._id });
		this.scheduleExpirationCheckByCallId(call._id);
		return actorAgent.oppositeAgent?.onCallActive(call._id);
	}

	public async acceptCall(
		call: MediaCallHeader,
		calleeAgent: IMediaCallAgent,
		data: { calleeContractId: string; webrtcAnswer?: RTCSessionDescriptionInit },
	): Promise<boolean> {
		logger.debug({ msg: 'MediaCallDirector.acceptCall' });

		// To avoid race conditions, load the negotiation before changing the call state
		// Once the state changes, negotiations need to be referred by id.
		const negotiation = await MediaCallNegotiations.findLatestByCallId(call._id);

		const { webrtcAnswer, ...acceptData } = data;

		const stateResult = await MediaCalls.acceptCallById(call._id, acceptData, this.getNewExpirationTime());
		// If nothing changed, the call was no longer ringing
		if (!stateResult.modifiedCount) {
			return false;
		}

		logger.info({ msg: 'Call was flagged as accepted', callId: call._id });
		this.scheduleExpirationCheckByCallId(call._id);

		await calleeAgent.onCallAccepted(call._id, data.calleeContractId);
		await calleeAgent.oppositeAgent?.onCallAccepted(call._id, call.caller.contractId);

		if (data.webrtcAnswer && negotiation) {
			const negotiationResult = await MediaCallNegotiations.setAnswerById(negotiation._id, data.webrtcAnswer);
			if (negotiationResult.modifiedCount) {
				logger.info({ msg: 'Negotiation answer was saved', callId: call._id, negotiationId: negotiation._id });
			}
			await calleeAgent.oppositeAgent?.onRemoteDescriptionChanged(call._id, negotiation._id);
		}

		return true;
	}

	public async startFirstNegotiation(
		call: MediaCallHeader,
		offer?: RTCSessionDescriptionInit,
	): Promise<IMediaCallNegotiation['_id'] | null> {
		const negotiation = await MediaCallNegotiations.findLatestByCallId(call._id);
		// If the call already has a negotiation, do nothing
		if (negotiation) {
			return null;
		}

		return this.startNewNegotiation(call, 'caller', offer);
	}

	public async startNewNegotiation(
		call: MediaCallHeader,
		offerer: CallRole,
		offer?: RTCSessionDescriptionInit,
	): Promise<IMediaCallNegotiation['_id']> {
		logger.debug({ msg: 'Adding new negotiation', callId: call._id, offerer, hasOffer: Boolean(offer) });
		const newNegotiation: InsertionModel<IMediaCallNegotiation> = {
			callId: call._id,
			offerer,
			requestTimestamp: new Date(),
			...(offer && {
				offer,
				offerTimestamp: new Date(),
			}),
		};

		const result = await MediaCallNegotiations.insertOne(newNegotiation);
		logger.info({ msg: 'New Negotiation started', callId: call._id, negotiationId: result.insertedId, hasOffer: Boolean(offer) });
		return result.insertedId;
	}

	public get cast(): IMediaCallCastDirector {
		try {
			return getCastDirector();
		} catch (err) {
			logger.error({ msg: 'Failed to access castDirector', err });
			throw err;
		}
	}

	public async saveWebrtcSession(
		call: IMediaCall,
		fromAgent: IMediaCallAgent,
		session: { sdp: RTCSessionDescriptionInit; negotiationId: string },
		contractId: string,
	): Promise<void> {
		logger.debug({ msg: 'MediaCallDirector.saveWebrtcSession', callId: call?._id });
		const negotiation = await MediaCallNegotiations.findOneById(session.negotiationId);
		if (!negotiation) {
			throw new Error('invalid-negotiation');
		}

		const actor = fromAgent.getMyCallActor(call);
		if (!actor.contractId || actor.contractId !== contractId) {
			throw new Error('invalid-contract');
		}

		const isOfferer = fromAgent.role === negotiation.offerer;
		const isOffer = session.sdp.type === 'offer';

		if (isOffer !== isOfferer) {
			throw new Error('invalid-sdp');
		}

		const updater = isOffer
			? MediaCallNegotiations.setOfferById(negotiation._id, session.sdp)
			: MediaCallNegotiations.setAnswerById(negotiation._id, session.sdp);
		const updateResult = await updater;

		if (!updateResult.modifiedCount) {
			return;
		}

		logger.info({ msg: `Negotiation's ${session.sdp.type} was saved`, callId: call._id, negotiationId: negotiation._id });

		await fromAgent.oppositeAgent?.onRemoteDescriptionChanged(call._id, negotiation._id);
	}

	public async createCall(params: CreateCallParams): Promise<IMediaCall> {
		const { caller, callee, requestedCallId, requestedService, callerAgent, calleeAgent, parentCallId, requestedBy } = params;

		// The caller must always have a contract to create the call
		if (!caller.contractId) {
			throw new Error('invalid-caller');
		}

		const service = requestedService || 'webrtc';

		// webrtc is our only known service right now, but if the call was requested by a client that doesn't also implement it, we don't need to even create a call
		if (service !== 'webrtc') {
			throw new Error('invalid-call-service');
		}

		if (!callerAgent) {
			throw new Error('invalid-caller');
		}

		if (!calleeAgent) {
			throw new Error('invalid-callee');
		}

		callerAgent.oppositeAgent = calleeAgent;
		calleeAgent.oppositeAgent = callerAgent;

		const call: Omit<IMediaCall, '_id' | '_updatedAt'> = {
			service,
			kind: 'direct',
			state: 'none',

			createdBy: requestedBy || caller,
			createdAt: new Date(),

			caller,
			callee,

			expiresAt: this.getNewExpirationTime(),
			uids: [
				// add actor ids to uids field if their type is 'user', to make it easy to identify any call an user was part of
				...(caller.type === 'user' ? [caller.id] : []),
				...(callee.type === 'user' ? [callee.id] : []),
			],
			ended: false,

			...(requestedCallId && { callerRequestedId: requestedCallId }),
			...(parentCallId && { parentCallId }),
		};

		logger.debug({ msg: 'creating call', call });

		const insertResult = await MediaCalls.insertOne(call);
		if (!insertResult.insertedId) {
			throw new Error('failed-to-create-call');
		}

		const newCall = await MediaCalls.findOneById(insertResult.insertedId);
		if (!newCall) {
			throw new Error('failed-to-retrieve-call');
		}

		logger.info({ msg: `New call was created`, callId: newCall._id });
		this.scheduleExpirationCheckByCallId(newCall._id);

		return newCall;
	}

	public async transferCall(
		call: MediaCallHeader,
		to: MediaCallContact,
		by: MediaCallSignedContact,
		agent: IMediaCallAgent,
	): Promise<void> {
		if (!agent.oppositeAgent) {
			logger.error('Unable to transfer calls without a reference to the opposite agent.');
			return;
		}

		const updateResult = await MediaCalls.transferCallById(call._id, { by, to });
		if (!updateResult.modifiedCount) {
			return;
		}

		logger.info({ msg: `Call was flagged as transferred`, callId: call._id });

		await agent.oppositeAgent.onCallTransferred(call._id);
	}

	public async hangupTransferredCallById(callId: string): Promise<boolean> {
		logger.debug({ msg: 'MediaCallDirector.hangupTransferredCallById', callId });
		const call = await MediaCalls.findOneById(callId);
		if (!call?.transferredBy) {
			return false;
		}

		return this.hangupDetachedCall(call, { endedBy: call.transferredBy, reason: 'transfer' });
	}

	public async hangupExpiredCalls(): Promise<void>;

	public async hangupExpiredCalls(expectedCallId: string): Promise<boolean>;

	public async hangupExpiredCalls(expectedCallId?: string): Promise<boolean | void> {
		logger.debug('MediaCallDirector.hangupExpiredCalls');

		let expectedCallWasExpired = false;

		const result = MediaCalls.findAllExpiredCalls<MediaCallHeader>({
			projection: { _id: 1, caller: 1, callee: 1 },
		});

		for await (const call of result) {
			if (expectedCallId && call._id === expectedCallId) {
				expectedCallWasExpired = true;
			}

			await this.hangupByServer(call, 'expired');
		}

		if (typeof expectedCallId === 'string') {
			return expectedCallWasExpired;
		}
	}

	public getNewExpirationTime(): Date {
		return new Date(Date.now() + EXPIRATION_TIME);
	}

	public async renewCallId(callId: string): Promise<void> {
		await MediaCalls.setExpiresAtById(callId, this.getNewExpirationTime());
		this.scheduleExpirationCheckByCallId(callId);
	}

	public scheduleExpirationCheckByCallId(callId: string): void {
		const oldHandler = scheduledExpirationChecks.get(callId);
		if (oldHandler) {
			clearTimeout(oldHandler);
			scheduledExpirationChecks.delete(callId);
		}

		const handler = setTimeout(async () => {
			logger.debug({ msg: 'MediaCallDirector.scheduleExpirationCheckByCallId.timeout', callId });
			scheduledExpirationChecks.delete(callId);

			const expectedCallWasExpired = await this.hangupExpiredCalls(callId).catch((err) =>
				logger.error({ msg: 'Media Call Monitor failed to hangup expired calls', err }),
			);

			if (!expectedCallWasExpired) {
				const call = await MediaCalls.findOneById(callId, { projection: { ended: 1 } });
				if (call && !call.ended) {
					this.scheduleExpirationCheckByCallId(callId);
				}
			}
		}, EXPIRATION_CHECK_TIMEOUT);

		scheduledExpirationChecks.set(callId, handler);
	}

	public scheduleExpirationCheck(): void {
		setTimeout(async () => {
			logger.debug({ msg: 'MediaCallDirector.scheduleExpirationCheck.timeout' });
			await this.hangupExpiredCalls().catch((err) => logger.error({ msg: 'Media Call Monitor failed to hangup expired calls', err }));
		}, EXPIRATION_CHECK_TIMEOUT);
	}

	public async runOnCallCreatedForAgent(call: IMediaCall, agent: IMediaCallAgent, agentToNotifyIfItFails?: IMediaCallAgent): Promise<void> {
		try {
			await agent.onCallCreated(call);
		} catch (err) {
			// If the agent failed, we assume they cleaned up after themselves and just hangup the call
			// We then notify the other agent that the call has ended, but only if it the agent was already notified about this call in the first place
			logger.error({
				msg: 'Agent failed to process a new call.',
				err,
				agentRole: agent.role,
				callerType: call.caller.type,
				calleeType: call.callee.type,
			});
			await this.hangupCallByIdAndNotifyAgents(call._id, agentToNotifyIfItFails ? [agentToNotifyIfItFails] : [], {
				endedBy: agent.getMyCallActor(call),
				reason: 'error',
			});
			throw err;
		}
	}

	public async hangupCallById(callId: string, params?: { endedBy?: IMediaCall['endedBy']; reason?: string }): Promise<boolean> {
		// Ensure we don't pass along anything more than the three basic actor attributes
		const endedBy =
			params?.endedBy?.type === 'server'
				? { type: params.endedBy.type, id: params.endedBy.id }
				: params?.endedBy && { type: params.endedBy.type, id: params.endedBy.id, contractId: params.endedBy.contractId };

		const cleanedParams = params && {
			...params,
			...(endedBy && { endedBy }),
		};

		const result = await MediaCalls.hangupCallById(callId, cleanedParams).catch((err) => {
			logger.error({
				msg: 'Failed to hangup a call.',
				callId,
				err,
				hangupReason: params?.reason,
				hangupActor: params?.endedBy,
			});
			throw err;
		});

		const ended = Boolean(result.modifiedCount);
		if (ended) {
			logger.info({ msg: 'Call was flagged as ended', callId, reason: params?.reason });
			getMediaCallServer().updateCallHistory({ callId });
		}

		return ended;
	}

	public async hangupCallByIdAndNotifyAgents(
		callId: string,
		agents: IMediaCallAgent[],
		params?: { endedBy?: IMediaCall['endedBy']; reason?: string },
	): Promise<boolean> {
		const modified = await this.hangupCallById(callId, params).catch(() => false);
		if (!modified || !agents?.length) {
			return modified;
		}

		await Promise.allSettled(
			agents.map(async (agent) =>
				agent.onCallEnded(callId).catch((err) => logger.error({ msg: 'Failed to notify agent of a hangup', err, actor: agent.actor })),
			),
		);
		return modified;
	}

	public async hangupDetachedCall(call: MediaCallHeader, params?: { endedBy?: IMediaCall['endedBy']; reason?: string }): Promise<boolean> {
		logger.debug({ msg: 'MediaCallDirector.hangupDetachedCall', callId: call._id, params });
		let modified = false;
		try {
			const endedBy = params?.endedBy || ({ type: 'server', id: 'server' } as ServerActor);

			modified = await this.hangupCallById(call._id, { ...params, endedBy });
			if (!modified) {
				return modified;
			}

			// Try to notify the agents but there's no guarantee they are reachable
			try {
				const agents = await this.cast.getAgentsFromCall(call);
				for (const agent of Object.values(agents)) {
					agent?.onCallEnded(call._id).catch(() => null);
				}
			} catch {
				// Ignore errors on the ended event
			}
			return modified;
		} catch (err) {
			logger.error({ msg: 'Failed to terminate call.', err, callId: call._id, params });
			return modified;
		}
	}
}

export const mediaCallDirector = new MediaCallDirector();
