import type { IMediaCall } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { sendSignalToActor } from './sendSignalToActor';

export async function sendNewSignals(callId: string): Promise<IMediaCall> {
	const call = await MediaCalls.getNewSequence(callId);

	console.log('sendNewSignals', call);

	if (!call) {
		throw new Error('failed-to-create-call');
	}

	const signalData = {
		callId: call._id,
		sequence: call.sequence,
		type: 'notify',
		body: {
			notify: 'new',
			service: call.service,
			kind: call.kind,
		},
	} as const;

	await Promise.allSettled([
		sendSignalToActor(call.caller, {
			...signalData,
			role: 'caller',
		}),
		sendSignalToActor(call.callee, {
			...signalData,
			role: 'callee',
		}),
	]);

	return call;
}
