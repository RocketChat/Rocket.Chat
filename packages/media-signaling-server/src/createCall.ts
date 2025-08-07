import type { IMediaCall, MediaCallActor, MediaCallSignedActor } from '@rocket.chat/core-typings';
import type { CallService } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { agentManager } from './agents/Manager';

export type CreateCallParams = {
	caller: MediaCallSignedActor;
	callee: MediaCallActor;
	requestedCallId?: string;
	requestedService?: CallService;
};

export async function createCall(params: CreateCallParams): Promise<IMediaCall> {
	console.log('createCall', params);
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
