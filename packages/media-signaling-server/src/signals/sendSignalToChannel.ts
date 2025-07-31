import type { ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalBodyAndType, MediaSignalType } from '@rocket.chat/media-signaling';

import { isValidSignalRole } from './isValidSignalRole';
import { sendSignal } from './signalHandler';
import { logger } from '../utils/logger';

export async function sendSignalToChannel<T extends MediaSignalType>(
	channel: ValidSignalChannel,
	signal: MediaSignalBodyAndType<T>,
): Promise<void> {
	if (!isValidSignalRole(channel.role)) {
		logger.info({ msg: 'tried to send a signal to a channel with invalid role', channel, signal });
		return;
	}

	logger.debug({ msg: 'sending signal to channel', channel, signal });
	await sendSignal(channel.participant.id, {
		callId: channel.callId,
		sessionId: channel.participant.sessionId,
		...signal,
	});
}
