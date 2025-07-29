import type { IMediaCall } from '@rocket.chat/core-typings';

import { getNewCallSequence } from './getNewCallSequence';
import { sendSignalToAllActors } from '../signals/sendSignalToAllActors';

export async function processEndedCall(callId: IMediaCall['_id']): Promise<void> {
	const call = await getNewCallSequence(callId);

	await sendSignalToAllActors(call, {
		sequence: call.sequence,
		type: 'notify',
		body: {
			notify: 'hangup',
			reasonCode: 'normal',
		},
	});
}
