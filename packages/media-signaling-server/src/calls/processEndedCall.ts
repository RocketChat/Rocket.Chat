import type { IMediaCall } from '@rocket.chat/core-typings';

import { sendSignalToAllActors } from '../signals/sendSignalToAllActors';

export async function processEndedCall(call: IMediaCall): Promise<void> {
	await sendSignalToAllActors(call, {
		type: 'notification',
		body: {
			notification: 'hangup',
		},
	});
}
