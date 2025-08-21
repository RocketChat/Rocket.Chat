import type { AtLeast, IMediaCall, MediaCallActor, MediaCallSignedActor, ServerActor } from '@rocket.chat/core-typings';
import type { CallHangupReason, CallService } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import type { IMediaCallAgent } from '../agents/definition/IMediaCallAgent';
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

	public static async hangupByServer(call: AtLeast<IMediaCall, '_id' | 'caller' | 'callee'>, serverErrorCode: string): Promise<boolean> {
		logger.debug({ msg: 'MediaCallDirector.hangupByServer', callId: call._id, serverErrorCode });

		const endedBy = { type: 'server', id: 'server' } as ServerActor;

		const modified = await this.hangupCallById(call._id, { endedBy, reason: serverErrorCode });
		// #ToDo: Report call without agent

		// if (modified) {
		// 	await AgentManager.runForAllAgents(call, (agent) => agent.onCallEnded(call._id));
		// }

		return modified;
	}

	public static async activate(call: IMediaCall, actorAgent: IMediaCallAgent): Promise<void> {
		logger.debug({ msg: 'MediaCallDirector.activateCall' });

		const stateResult = await MediaCalls.activateCallById(call._id, this.getNewExpirationTime());
		if (!stateResult.modifiedCount) {
			return;
		}

		return actorAgent.oppositeAgent?.onCallActive(call._id);
	}

	public static async acceptCall(call: IMediaCall, calleeAgent: IMediaCallAgent, contractId: string): Promise<void> {
		logger.debug({ msg: 'MediaCallDirector.acceptCall' });

		const stateResult = await MediaCalls.acceptCallById(call._id, contractId, this.getNewExpirationTime());
		// If nothing changed, the call was no longer ringing
		if (!stateResult.modifiedCount) {
			return;
		}

		// const callerChannel = await MediaCallChannels.findOneByCallIdAndSignedActor({
		// 	callId: call._id,
		// 	type: call.caller.type,
		// 	id: call.caller.id,
		// 	contractId: call.caller.contractId,
		// });

		// if (!callerChannel?.localDescription) {
		// 	// #ToDo: log and hangup
		// 	return;
		// }

		await calleeAgent.onCallAccepted(call._id, contractId);
		await calleeAgent.oppositeAgent?.onCallAccepted(call._id, call.caller.contractId);
	}

	public static async createCall(params: CreateCallParams): Promise<IMediaCall> {
		logger.debug({ msg: 'MediaCallDirector.createCall', params });
		const { caller, callee, requestedCallId, requestedService, callerAgent, calleeAgent } = params;

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
		};

		console.log('creating call', call);

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
