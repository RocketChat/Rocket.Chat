import type { IMediaCall, IUser, MediaCallActor } from '@rocket.chat/core-typings';
import type { ClientMediaSignalRequestCall, ServerMediaSignalRejectedCallRequest } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { createCall } from './createCall';
import { logger } from './logger';
import { mutateCallee } from './mutateCallee';
import { sendSignal } from './signalHandler';

function invalidCallId(uid: IUser['_id'], rejection: Omit<ServerMediaSignalRejectedCallRequest, 'type'>): never {
	void sendSignal(uid, { type: 'rejected-call-request', ...rejection }).catch(() => null);

	throw new Error(rejection.reason ?? 'invalid-call-id');
}

async function getExistingCall(
	uid: IUser['_id'],
	signal: ClientMediaSignalRequestCall,
	callee: MediaCallActor,
): Promise<IMediaCall | null> {
	const { callId: requestedCallId, callee: originalCallee } = signal;

	if (!requestedCallId) {
		return null;
	}

	logger.debug({ msg: 'getExistingCall', uid, signal, callee });

	const caller = { type: 'user', id: uid } as const;
	const rejection = { callId: requestedCallId, toContractId: signal.contractId, reason: 'invalid-call-id' } as const;

	const call = await MediaCalls.findOneByIdOrCallerRequestedId(requestedCallId, caller);

	if (!call) {
		return null;
	}

	// if the requested id matches a real call id, we block it to avoid any potential issues as the requestedId is not expected to ever be an actual call id.
	// if the call is already over, we treat it as an invalid id since it can't be reused
	if (call._id === requestedCallId || call.state === 'hangup') {
		invalidCallId(uid, rejection);
	}

	const isMutatedCallee = call.callee.type === callee.type && call.callee.id === callee.id;
	const isOriginalCallee = call.callee.type === originalCallee.type && call.callee.id === originalCallee.id;
	const isSameCallee = isMutatedCallee || isOriginalCallee;
	const isSameContract = call.caller.contractId === signal.contractId;

	if (!isSameCallee || !isSameContract) {
		invalidCallId(uid, { ...rejection, reason: 'existing-call-id' });
	}

	if (signal.supportedServices?.length && !signal.supportedServices.includes(call.service)) {
		invalidCallId(uid, { ...rejection, reason: 'unsupported' });
	}

	// if the call is already accepted, we won't send its signals again
	if (['active'].includes(call.state)) {
		invalidCallId(uid, { ...rejection, reason: 'already-requested' });
	}

	sendSignal(uid, {
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

export async function processNewCallSignal(signal: ClientMediaSignalRequestCall, uid: IUser['_id']): Promise<void> {
	logger.debug({ msg: 'processNewCallSignal', signal, uid });

	const caller = { type: 'user', id: uid } as const;
	const callee = await mutateCallee(signal.callee);

	const existingCall = await getExistingCall(uid, signal, callee);

	if (existingCall) {
		return;
	}

	const services = signal.supportedServices ?? [];
	const requestedService = services.includes('webrtc') ? 'webrtc' : services.shift();

	try {
		await createCall({
			caller: {
				...caller,
				contractId: signal.contractId,
			},
			callee: await mutateCallee(signal.callee),
			requestedCallId: signal.callId,
			...(requestedService && { requestedService }),
		});
	} catch (e) {
		void sendSignal(uid, {
			type: 'rejected-call-request',
			callId: signal.callId,
			toContractId: signal.contractId,
			reason: 'unsupported',
		}).catch(() => null);
		throw e;
	}
}
