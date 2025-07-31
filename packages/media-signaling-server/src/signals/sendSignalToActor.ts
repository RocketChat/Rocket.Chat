import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
import type { MediaSignalBodyAndType, MediaSignalType } from '@rocket.chat/media-signaling';

import { sendSignal } from './signalHandler';
import { logger } from '../utils/logger';

export async function sendSignalToActor<T extends MediaSignalType>(
	actor: MediaCallActor,
	signal: { callId: IMediaCall['_id'] } & MediaSignalBodyAndType<T>,
): Promise<void> {
	if (actor.type !== 'user') {
		return;
	}

	logger.debug({ msg: 'sending signal to actor', actor, signal });
	await sendSignal(actor.id, {
		...('sessionId' in actor && { sessionId: actor.sessionId }),
		...signal,
	});
}
