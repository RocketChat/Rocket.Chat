import type { ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignal } from '@rocket.chat/media-signaling';

import { isValidSignalRole } from './isValidSignalRole';
import { sendSignal } from './sendSignal';

export async function sendSignalToChannel(
	sequence: number,
	channel: ValidSignalChannel,
	signal: Omit<MediaSignal, 'version' | 'sequence' | 'callId' | 'role' | 'sessionId'>,
): Promise<void> {
	if (!isValidSignalRole(channel.role)) {
		// Tried to send a signal to a channel that is neither the caller nor the callee... what to do?
		return;
	}

	await sendSignal({
		...signal,
		role: channel.role,
		sessionId: channel.participant.sessionId,
		version: 1,
		sequence,
		callId: channel.callId,
	} as MediaSignal);
}
