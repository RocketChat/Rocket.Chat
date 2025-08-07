import type { IMediaCall, MediaCallActor, MediaCallSignedActor } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { agentManager } from './agents/Manager';

export async function createCall(caller: MediaCallSignedActor, callee: MediaCallActor, requestedCallId?: string): Promise<IMediaCall> {
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

	const call: Omit<IMediaCall, '_id' | '_updatedAt'> = {
		service: 'webrtc',
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
