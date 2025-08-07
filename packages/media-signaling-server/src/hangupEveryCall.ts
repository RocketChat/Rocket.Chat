import { MediaCalls } from '@rocket.chat/models';

export async function hangupEveryCall(hangupReason?: string): Promise<void> {
	// change every pending or active call state to 'hangup' with the specified reason

	await MediaCalls.hangupEveryCall({
		endedBy: { type: 'server', id: 'server' },
		reason: hangupReason || 'full-server-hangup',
	});
}
