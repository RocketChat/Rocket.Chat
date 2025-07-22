import type { ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalBody, MediaSignalType } from '@rocket.chat/media-signaling';

import { buildSignal } from './buildSignal';
import { isValidSignalRole } from './isValidSignalRole';
import { sendSignal } from './signalHandler';
import { logger } from '../utils/logger';

export async function sendSignalToChannel<T extends MediaSignalType>(
	channel: ValidSignalChannel,
	signal: { sequence: number; type: T; body: MediaSignalBody<T> },
): Promise<void> {
	if (!isValidSignalRole(channel.role)) {
		logger.info({ msg: 'tried to send a signal to a channel with invalid role', channel, signal });
		return;
	}

	const fullSignal = buildSignal(
		{
			role: channel.role,
			sessionId: channel.participant.sessionId,
			version: 1,
			sequence: signal.sequence,
			callId: channel.callId,
		},
		signal.type,
		signal.body,
	);

	logger.debug({ msg: 'sending signal to channel', channel, signal });
	await sendSignal(channel.participant.id, fullSignal);
}
