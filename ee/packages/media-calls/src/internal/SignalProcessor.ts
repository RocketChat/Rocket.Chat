import type { IMediaCall, IUser, MediaCallActor } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type {
	ClientMediaSignal,
	ClientMediaSignalRegister,
	ClientMediaSignalRequestCall,
	ServerMediaSignal,
	ServerMediaSignalRejectedCallRequest,
} from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import type { InternalCallParams } from '../definition/common';
import { logger } from '../logger';
import { MediaCallDirector } from '../server/CallDirector';
import { UserActorAgent } from './agents/BaseUserAgent';

export type SignalProcessorEvents = {
	signalRequest: { toUid: IUser['_id']; signal: ServerMediaSignal };
	callRequest: { fromUid: IUser['_id']; params: InternalCallParams };
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

	protected createCall(fromUid: IUser['_id'], params: InternalCallParams): void {
		this.emitter.emit('callRequest', { fromUid, params });
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

	private async processRegisterSignal(_uid: IUser['_id'], _signal: ClientMediaSignalRegister): Promise<void> {
		// #TODO: client registration
		// 1. Re-send signals for any pending calls involving this actor;
		// 2. Hangup active calls involving the oldContractId if it's different from the new one.
	}

	private async processRequestCallSignal(uid: IUser['_id'], signal: ClientMediaSignalRequestCall): Promise<void> {
		logger.debug({ msg: 'GlobalSignalProcessor.processRequestCallSignal', signal, uid });

		// The caller contact should always be from type = 'user' when the call was initiated from rocket.chat
		const caller = await MediaCallDirector.cast.getContactForUserId(uid, { requiredType: 'user' });
		if (!caller) {
			throw new Error('Failed to load caller contact information');
		}

		// The callee contact type will determine if the call is going to go through SIP or directly to another rocket.chat user
		const callee = await MediaCallDirector.cast.getContactForActor(signal.callee, { preferredType: 'user' });
		if (!callee) {
			throw new Error('Failed to load callee contact information');
		}

		const existingCall = await this.getExistingRequestedCall(uid, signal, callee);

		if (existingCall) {
			return;
		}

		const services = signal.supportedServices ?? [];
		const requestedService = services.includes('webrtc') ? 'webrtc' : services.shift();

		const params: InternalCallParams = {
			caller: {
				...caller,
				contractId: signal.contractId,
			},
			callee,
			requestedCallId: signal.callId,
			...(requestedService && { requestedService }),
		};

		this.emitter.emit('callRequest', { fromUid: uid, params });
	}

	private async getExistingRequestedCall(
		uid: IUser['_id'],
		signal: ClientMediaSignalRequestCall,
		callee: MediaCallActor,
	): Promise<IMediaCall | null> {
		const { callId: requestedCallId, callee: originalCallee } = signal;

		if (!requestedCallId) {
			return null;
		}

		logger.debug({ msg: 'GlobalSignalProcessor.getExistingRequestedCall', uid, signal, callee });

		const caller = { type: 'user', id: uid } as const;
		const rejection = { callId: requestedCallId, toContractId: signal.contractId, reason: 'invalid-call-id' } as const;

		const call = await MediaCalls.findOneByIdOrCallerRequestedId(requestedCallId, caller);

		if (!call) {
			return null;
		}

		// if the requested id matches a real call id, we block it to avoid any potential issues as the requestedId is not expected to ever be an actual call id.
		// if the call is already over, we treat it as an invalid id since it can't be reused
		if (call._id === requestedCallId || call.state === 'hangup') {
			this.invalidCallId(uid, rejection);
		}

		const isMutatedCallee = call.callee.type === callee.type && call.callee.id === callee.id;
		const isOriginalCallee = call.callee.type === originalCallee.type && call.callee.id === originalCallee.id;
		const isSameCallee = isMutatedCallee || isOriginalCallee;
		const isSameContract = call.caller.contractId === signal.contractId;

		if (!isSameCallee || !isSameContract) {
			this.invalidCallId(uid, { ...rejection, reason: 'existing-call-id' });
		}

		if (signal.supportedServices?.length && !signal.supportedServices.includes(call.service)) {
			this.invalidCallId(uid, { ...rejection, reason: 'unsupported' });
		}

		// if the call is already accepted, we won't send its signals again
		if (['active'].includes(call.state)) {
			this.invalidCallId(uid, { ...rejection, reason: 'already-requested' });
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

	private invalidCallId(uid: IUser['_id'], rejection: Omit<ServerMediaSignalRejectedCallRequest, 'type'>): never {
		this.sendSignal(uid, { type: 'rejected-call-request', ...rejection });

		throw new Error(rejection.reason ?? 'invalid-call-id');
	}
}
