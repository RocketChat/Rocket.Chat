import type {
	AtLeast,
	IMediaCall,
	IMediaCallNegotiation,
	MediaCallActor,
	MediaCallSignedActor,
	ServerActor,
} from '@rocket.chat/core-typings';
import type { CallHangupReason, CallService } from '@rocket.chat/media-signaling';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { MediaCallNegotiations, MediaCalls } from '@rocket.chat/models';

import { getCastDirector } from './injection';
import type { IMediaCallAgent } from '../definition/IMediaCallAgent';
import type { IMediaCallCastDirector } from '../definition/IMediaCallCastDirector';
import type { MediaCallHeader } from '../definition/common';
import { logger } from '../logger';

const EXPIRATION_TIME = 120000;
const EXPIRATION_CHECK_DELAY = 1000;

export type CreateCallParams = {
	caller: MediaCallSignedActor;
	callee: MediaCallActor;
	requestedCallId?: string;
	requestedService?: CallService;

	callerAgent: IMediaCallAgent;
	calleeAgent: IMediaCallAgent;

	webrtcOffer?: RTCSessionDescriptionInit;
};

export class MediaCallDirector {
	public static async hangup(call: IMediaCall, actorAgent: IMediaCallAgent, reason: CallHangupReason): Promise<void> {
		const { actor: endedBy } = actorAgent;
		logger.debug({ msg: 'MediaCallDirector.hangup', callId: call._id, reason, endedBy });

		const modified = await this.hangupCallById(call._id, { endedBy, reason });
		if (modified) {
			await actorAgent.onCallEnded(call._id);
			await actorAgent.oppositeAgent?.onCallEnded(call._id);
		}
	}

	public static async hangupByServer(call: AtLeast<IMediaCall, '_id' | 'caller' | 'callee'>, serverErrorCode: string): Promise<void> {
		logger.debug({ msg: 'MediaCallDirector.hangupByServer', callId: call._id, serverErrorCode });
		try {
			const endedBy = { type: 'server', id: 'server' } as ServerActor;

			const modified = await this.hangupCallById(call._id, { endedBy, reason: serverErrorCode });
			if (!modified) {
				return;
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
		} catch (error) {
			logger.error({ msg: 'Failed to terminate call.', error, callId: call._id, serverErrorCode });
		}
	}

	public static async activate(call: IMediaCall, actorAgent: IMediaCallAgent): Promise<void> {
		logger.debug({ msg: 'MediaCallDirector.activateCall' });

		const stateResult = await MediaCalls.activateCallById(call._id, this.getNewExpirationTime());
		if (!stateResult.modifiedCount) {
			return;
		}

		return actorAgent.oppositeAgent?.onCallActive(call._id);
	}

	public static async acceptCall(
		call: MediaCallHeader,
		calleeAgent: IMediaCallAgent,
		data: { calleeContractId: string; webrtcAnswer?: RTCSessionDescriptionInit },
	): Promise<boolean> {
		logger.debug({ msg: 'MediaCallDirector.acceptCall' });

		// To avoid race conditions, load the negotiation before changing the call state
		// Once the state changes, negotiations need to be referred by id.
		const negotiation = await MediaCallNegotiations.findLatestByCallId(call._id);

		const stateResult = await MediaCalls.acceptCallById(call._id, data, this.getNewExpirationTime());
		// If nothing changed, the call was no longer ringing
		if (!stateResult.modifiedCount) {
			return false;
		}

		await calleeAgent.onCallAccepted(call._id, data.calleeContractId);
		await calleeAgent.oppositeAgent?.onCallAccepted(call._id, call.caller.contractId);

		if (data.webrtcAnswer && negotiation) {
			await MediaCallNegotiations.setAnswerById(negotiation._id, data.webrtcAnswer);
			await calleeAgent.oppositeAgent?.onRemoteDescriptionChanged(call._id, negotiation._id);
		}

		return true;
	}

	public static async startFirstNegotiation(
		call: MediaCallHeader,
		offer?: RTCSessionDescriptionInit,
	): Promise<IMediaCallNegotiation['_id'] | null> {
		const negotiation = await MediaCallNegotiations.findLatestByCallId(call._id);
		// If the call already has a negotiation, do nothing
		if (negotiation) {
			return null;
		}

		const newNegotiation: InsertionModel<IMediaCallNegotiation> = {
			callId: call._id,
			offerer: 'caller',
			requestTimestamp: new Date(),
			...(offer && {
				offer,
				offerTimestamp: new Date(),
			}),
		};

		const result = await MediaCallNegotiations.insertOne(newNegotiation);
		return result.insertedId;
	}

	public static get cast(): IMediaCallCastDirector {
		try {
			return getCastDirector();
		} catch (error) {
			logger.error({ msg: 'Failed to access castDirector', error });
			throw error;
		}
	}

	public static async saveWebrtcSession(
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

		await fromAgent.oppositeAgent?.onRemoteDescriptionChanged(call._id, negotiation._id);
		// await MediaCalls.setExpiresAtById(call._id, this.getNewExpirationTime());
	}

	public static async createCall(params: CreateCallParams): Promise<IMediaCall> {
		logger.debug({ msg: 'MediaCallDirector.createCall', params });
		const { caller, callee, requestedCallId, requestedService, callerAgent, calleeAgent, webrtcOffer } = params;

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

			createdBy: caller,
			createdAt: new Date(),

			caller,
			callee,

			expiresAt: MediaCallDirector.getNewExpirationTime(),

			...(requestedCallId && { callerRequestedId: requestedCallId }),
			...(webrtcOffer && { webrtcOffer }),
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

		return newCall;
	}

	public static async hangupExpiredCalls(): Promise<void> {
		logger.debug('MediaCallDirector.hangupExpiredCalls');

		const result = MediaCalls.findAllExpiredCalls<Pick<IMediaCall, '_id' | 'caller' | 'callee'>>({
			projection: { _id: 1, caller: 1, callee: 1 },
		});

		for await (const call of result) {
			await this.hangupByServer(call, 'timeout');
		}
	}

	public static getNewExpirationTime(): Date {
		return new Date(Date.now() + EXPIRATION_TIME);
	}

	public static async renewCallId(callId: string): Promise<void> {
		await MediaCalls.setExpiresAtById(callId, this.getNewExpirationTime());
		this.scheduleExpirationCheck();
	}

	public static scheduleExpirationCheck(): void {
		setTimeout(
			() => this.hangupExpiredCalls().catch((error) => logger.error({ msg: 'Media Call Monitor failed to hangup expired calls', error })),
			EXPIRATION_TIME + EXPIRATION_CHECK_DELAY,
		);
	}

	public static async runOnCallCreatedForAgent(
		call: IMediaCall,
		agent: IMediaCallAgent,
		agentToNotifyIfItFails?: IMediaCallAgent,
	): Promise<void> {
		try {
			await agent.onCallCreated(call);
		} catch (error) {
			// If the agent failed, we assume they cleaned up after themselves and just hangup the call
			// We then notify the other agent that the call has ended, but only if it the agent was already notified about this call in the first place
			logger.error({
				msg: 'Agent failed to process a new call.',
				error,
				agentRole: agent.role,
				callerType: call.caller.type,
				calleeType: call.callee.type,
			});
			await this.hangupCallByIdAndNotifyAgents(call._id, agentToNotifyIfItFails ? [agentToNotifyIfItFails] : [], {
				endedBy: agent.getMyCallActor(call),
				reason: 'error',
			});
			throw error;
		}
	}

	public static async hangupCallById(callId: string, params?: { endedBy?: IMediaCall['endedBy']; reason?: string }): Promise<boolean> {
		// Ensure we don't pass along anything more than the three basic actor attributes
		const endedBy =
			params?.endedBy?.type === 'server'
				? { type: params.endedBy.type, id: params.endedBy.id }
				: params?.endedBy && { type: params.endedBy.type, id: params.endedBy.id, contractId: params.endedBy.contractId };

		const cleanedParams = params && {
			...params,
			...(endedBy && { endedBy }),
		};

		const result = await MediaCalls.hangupCallById(callId, cleanedParams).catch((error) => {
			logger.error({
				msg: 'Failed to hangup a call.',
				callId,
				hangupError: error,
				hangupReason: params?.reason,
				hangupActor: params?.endedBy,
			});
			throw error;
		});
		return Boolean(result.modifiedCount);
	}

	private static async hangupCallByIdAndNotifyAgents(
		callId: string,
		agents: IMediaCallAgent[],
		params?: { endedBy?: IMediaCall['endedBy']; reason?: string },
	): Promise<void> {
		const modified = await this.hangupCallById(callId, params).catch(() => false);
		if (!modified || !agents?.length) {
			return;
		}

		await Promise.allSettled(
			agents.map(async (agent) =>
				agent.onCallEnded(callId).catch((error) => logger.error({ msg: 'Failed to notify agent of a hangup', error, actor: agent.actor })),
			),
		);
	}
}
