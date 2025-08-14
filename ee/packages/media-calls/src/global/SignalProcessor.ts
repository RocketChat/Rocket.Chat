import type { IMediaCall, IUser, MediaCallActor } from '@rocket.chat/core-typings';
import type {
	CallActorType,
	ClientMediaSignal,
	ClientMediaSignalRegister,
	ClientMediaSignalRequestCall,
	ServerMediaSignal,
	ServerMediaSignalRejectedCallRequest,
} from '@rocket.chat/media-signaling';
import { MediaCalls, Users } from '@rocket.chat/models';

import { agentManager } from '../agents/Manager';
import { UserAgentFactory } from '../agents/users/AgentFactory';
import { logger } from '../logger';
import { MediaCallMonitor } from './CallMonitor';
import type { CreateCallParams } from './ISignalGateway';

export abstract class GlobalSignalProcessor {
	protected abstract sendSignal(toUid: IUser['_id'], signal: ServerMediaSignal): void;

	public async createCall(params: CreateCallParams): Promise<IMediaCall> {
		logger.debug({ msg: 'GlobalSignalProcessor.createCall', params });
		const { caller, callee, requestedCallId, requestedService } = params;

		// The caller must always have a contract to create the call
		if (!caller.contractId) {
			throw new Error('invalid-caller');
		}

		const callerAgent = await agentManager.getNewAgentForActor(caller, 'caller');
		if (!callerAgent) {
			throw new Error('invalid-caller');
		}

		const calleeAgent = await agentManager.getNewAgentForActor(callee, 'callee');
		if (!calleeAgent) {
			throw new Error('invalid-callee');
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

		await callerAgent.onNewCall(newCall, calleeAgent);
		await calleeAgent.onNewCall(newCall, callerAgent);

		return newCall;
	}

	protected async processSignal(uid: IUser['_id'], signal: ClientMediaSignal): Promise<void> {
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

	public async mutateCallee(callee: { type: CallActorType; id: string }): Promise<{ type: CallActorType; id: string }> {
		if (callee.type !== 'sip') {
			return callee;
		}

		const user = await Users.findOneByFreeSwitchExtension<Pick<IUser, '_id'>>(callee.id, { projection: { _id: 1 } });
		if (user) {
			return { type: 'user', id: user._id };
		}

		return callee;
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
			if (!isCaller && !isCallee) {
				logger.error({ msg: 'actor is not part of the call', method: 'processSignal', signal });
				throw new Error('invalid-call');
			}

			// Ignore signals from different sessions
			if (isCaller && call.caller.contractId && call.caller.contractId !== signal.contractId) {
				return;
			}
			if (isCallee && call.callee.contractId && call.callee.contractId !== signal.contractId) {
				return;
			}

			await MediaCallMonitor.renewCallId(call._id);

			const factory = await UserAgentFactory.getAgentFactoryForUser(uid, signal.contractId);
			const agent = factory?.getCallAgent(call);
			if (!agent) {
				logger.error({ msg: 'agent not found', method: 'processSignal', signal });
				throw new Error('invalid-call');
			}

			await agent.processSignal(signal, call);
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
		logger.debug({ msg: 'GlobalSignalProcessor.processNewCallSignal', signal, uid });

		const caller = { type: 'user', id: uid } as const;
		const callee = await this.mutateCallee(signal.callee);

		const existingCall = await this.getExistingRequestedCall(uid, signal, callee);

		if (existingCall) {
			return;
		}

		const services = signal.supportedServices ?? [];
		const requestedService = services.includes('webrtc') ? 'webrtc' : services.shift();

		try {
			await this.createCall({
				caller: {
					...caller,
					contractId: signal.contractId,
				},
				callee: await this.mutateCallee(signal.callee),
				requestedCallId: signal.callId,
				...(requestedService && { requestedService }),
			});
		} catch (e) {
			this.sendSignal(uid, {
				type: 'rejected-call-request',
				callId: signal.callId,
				toContractId: signal.contractId,
				reason: 'unsupported',
			});
			throw e;
		}
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
