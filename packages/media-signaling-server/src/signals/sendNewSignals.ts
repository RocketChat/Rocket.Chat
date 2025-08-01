import type { IMediaCall } from '@rocket.chat/core-typings';
import type { MediaSignalNewCall } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { sendSignalToActor } from './sendSignalToActor';

export async function sendNewSignals(callId: string): Promise<IMediaCall> {
	const call = await MediaCalls.getNewSequence(callId);

	console.log('sendNewSignals', call);

	if (!call) {
		throw new Error('failed-to-create-call');
	}

	const signalBody: Omit<MediaSignalNewCall, 'role'> = {
		service: call.service,
		kind: call.kind,
	};

	const header = {
		callId: call._id,
		type: 'new',
	} as const;

	const roles = ['caller', 'callee'] as const;

	await Promise.all(
		roles.map(async (role) => {
			const actor = call[role];
			await sendSignalToActor(actor, {
				...header,
				body: {
					...signalBody,
					role,
				},
			});
		}),
	);

	return call;
}
