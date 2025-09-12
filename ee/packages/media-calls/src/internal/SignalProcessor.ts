import type { IMediaCall, IUser } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import {
	isPendingState,
	type ClientMediaSignal,
	type ClientMediaSignalRegister,
	type ClientMediaSignalRequestCall,
	type ServerMediaSignal,
	type ServerMediaSignalRejectedCallRequest,
} from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import type { InternalCallParams } from '../definition/common';
import { logger } from '../logger';
import { MediaCallDirector } from '../server/CallDirector';
import { UserActorAgent } from './agents/BaseUserAgent';

export type SignalProcessorEvents = {
	signalRequest: { toUid: IUser['_id']; signal: ServerMediaSignal };
	callRequest: { params: InternalCallParams };
};

export class GlobalSignalProcessor {
	public readonly emitter: Emitter<SignalProcessorEvents>;

	constructor() {
		this.emitter = new Emitter();
	}

	public async processSignal(uid: IUser['_id'], signal: ClientMediaSignal): Promise<void> {
		logger.debug({ msg: 'GlobalSignalProcessor.processSignal', signal, uid });

		switch (signal.type) {
			case 'register':
				return this.processRegisterSignal(uid, signal);
			case 'request-call':
				return this.processRequestCallSignal(uid, signal);
		}

		if ('callId' in signal) {
			return this.processCallSignal(uid, signal);
		}

		logger.error({ msg: 'Unrecognized media signal', signal });
	}

	protected sendSignal(toUid: IUser['_id'], signal: ServerMediaSignal): void {
		this.emitter.emit('signalRequest', { toUid, signal });
	}

	protected createCall(params: InternalCallParams): void {
		this.emitter.emit('callRequest', { params });
	}

	private async processCallSignal(
		uid: IUser['_id'],
		signal: Exclude<ClientMediaSignal, ClientMediaSignalRegister | ClientMediaSignalRequestCall>,
	): Promise<void> {
		try {
			const call = await MediaCalls.findOneById(signal.callId);
			if (!call) {
				logger.error({ msg: 'call not found', method: 'GlobalSignalProcessor.processCallSignal', signal });
				throw new Error('invalid-call');
			}

			const isCaller = call.caller.type === 'user' && call.caller.id === uid;
			const isCallee = call.callee.type === 'user' && call.callee.id === uid;

			// The user must be either the caller or the callee, if its none or both, we can't process it
			if (isCaller === isCallee) {
				logger.error({ msg: 'failed to identify actor role in the call', method: 'processSignal', signal, isCaller, isCallee });
				throw new Error('invalid-call');
			}

			const role = isCaller ? 'caller' : 'callee';
			const callActor = call[role];

			// Ignore signals from different sessions if the actor is already signed
			if (callActor.contractId && callActor.contractId !== signal.contractId) {
				return;
			}

			await MediaCallDirector.renewCallId(call._id);

			const agents = await MediaCallDirector.cast.getAgentsFromCall(call);
			const { [role]: agent } = agents;

			if (!(agent instanceof UserActorAgent)) {
				throw new Error('Actor agent is not prepared to process signals');
			}

			await agent.processSignal(call, signal);
		} catch (e) {
			logger.error(e);
			throw e;
		}
	}

	private async processRegisterSignal(uid: IUser['_id'], signal: ClientMediaSignalRegister): Promise<void> {
		const calls = await MediaCalls.findAllNotOverByUid(uid).toArray();
		if (!calls.length) {
			return;
		}

		await Promise.all(calls.map((call) => this.reactToUnknownCall(uid, call, signal).catch(() => null)));
	}

	private async reactToUnknownCall(uid: IUser['_id'], call: IMediaCall, signal: ClientMediaSignalRegister): Promise<void> {
		if (call.state === 'hangup') {
			return;
		}

		const isCaller = call.caller.type === 'user' && call.caller.id === uid;
		const isCallee = call.callee.type === 'user' && call.callee.id === uid;

		if (!isCaller && !isCallee) {
			return;
		}

		const role = isCaller ? 'caller' : 'callee';
		const actor = call[role];

		// If this user's side of the call has already been signed
		if (actor.contractId) {
			// If it's signed to the same session that is now registering
			// Or it was signed by a session that the current session is replacing (as in a browser refresh)
			if (actor.contractId === signal.contractId || actor.contractId === signal.oldContractId) {
				await MediaCallDirector.hangupDetachedCall(call, { endedBy: { ...actor, contractId: signal.contractId }, reason: 'unknown' });
				return;
			}
		} else {
			await MediaCallDirector.renewCallId(call._id);
		}

		if (isCaller) {
			this.sendSignal(uid, {
				callId: call._id,
				type: 'new',
				service: call.service,
				kind: call.kind,
				role: 'caller',
				contact: {
					...call.callee,
				},
				...(call.callerRequestedId && { requestedCallId: call.callerRequestedId }),
			});
		}

		if (isCallee) {
			this.sendSignal(uid, {
				callId: call._id,
				type: 'new',
				service: call.service,
				kind: call.kind,
				role: 'callee',
				contact: {
					...call.caller,
				},
			});
		}

		if (call.state === 'active') {
			this.sendSignal(uid, {
				callId: call._id,
				type: 'notification',
				notification: 'active',
				...(actor.contractId && { signedContractId: actor.contractId }),
			});
		} else if (actor.contractId && !isPendingState(call.state)) {
			this.sendSignal(uid, {
				callId: call._id,
				type: 'notification',
				notification: 'accepted',
				signedContractId: actor.contractId,
			});
		}
	}

	private async processRequestCallSignal(uid: IUser['_id'], signal: ClientMediaSignalRequestCall): Promise<void> {
		logger.debug({ msg: 'GlobalSignalProcessor.processRequestCallSignal', signal, uid });
		const existingCall = await this.getExistingRequestedCall(uid, signal);
		if (existingCall) {
			return;
		}

		const hasCalls = await MediaCalls.hasUnfinishedCallsByUid(uid);
		if (hasCalls) {
			this.rejectCallRequest(uid, { callId: signal.callId, toContractId: signal.contractId, reason: 'busy' });
		}

		const services = signal.supportedServices ?? [];
		const requestedService = services.includes('webrtc') ? 'webrtc' : services.shift();

		const params: InternalCallParams = {
			caller: {
				type: 'user',
				id: uid,
				contractId: signal.contractId,
			},
			callee: signal.callee,
			requestedBy: {
				type: 'user',
				id: uid,
				contractId: signal.contractId,
			},
			requestedCallId: signal.callId,
			...(requestedService && { requestedService }),
		};

		this.createCall(params);
	}

	private async getExistingRequestedCall(uid: IUser['_id'], signal: ClientMediaSignalRequestCall): Promise<IMediaCall | null> {
		const { callId: requestedCallId } = signal;

		if (!requestedCallId) {
			return null;
		}

		logger.debug({ msg: 'GlobalSignalProcessor.getExistingRequestedCall', uid, signal });

		const caller = { type: 'user', id: uid } as const;
		const rejection = { callId: requestedCallId, toContractId: signal.contractId, reason: 'invalid-call-id' } as const;

		// The requestedCallId must never match a real call id
		const matchingValidCall = await MediaCalls.findOneById(requestedCallId, { projection: { _id: 1 } });
		if (matchingValidCall) {
			this.rejectCallRequest(uid, rejection);
		}

		const call = await MediaCalls.findOneByCallerRequestedId(requestedCallId, caller);
		if (!call) {
			return null;
		}

		// if the call is already over, we treat it as an invalid id since it can't be reused
		if (call.state === 'hangup') {
			this.rejectCallRequest(uid, rejection);
		}

		if (call.caller.contractId !== signal.contractId) {
			this.rejectCallRequest(uid, { ...rejection, reason: 'existing-call-id' });
		}

		if (signal.supportedServices?.length && !signal.supportedServices.includes(call.service)) {
			this.rejectCallRequest(uid, { ...rejection, reason: 'unsupported' });
		}

		// if the call is already accepted, we won't send its signals again
		if (!isPendingState(call.state)) {
			this.rejectCallRequest(uid, { ...rejection, reason: 'already-requested' });
		}

		this.sendSignal(uid, {
			callId: call._id,
			type: 'new',
			service: call.service,
			kind: call.kind,
			role: 'caller',
			contact: {
				...call.callee,
			},
			requestedCallId: signal.callId,
		});

		return call;
	}

	private rejectCallRequest(uid: IUser['_id'], rejection: Omit<ServerMediaSignalRejectedCallRequest, 'type'>): never {
		this.sendSignal(uid, { type: 'rejected-call-request', ...rejection });

		throw new Error(rejection.reason);
	}
}
