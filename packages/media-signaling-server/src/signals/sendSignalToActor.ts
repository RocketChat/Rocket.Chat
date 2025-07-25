import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
import type { MediaSignal, MediaSignalBody, MediaSignalType } from '@rocket.chat/media-signaling';

import { buildSignal } from './buildSignal';
import { sendSignal } from './signalHandler';
import { logger } from '../utils/logger';

export async function sendSignalToActor<T extends MediaSignalType>(
	actor: MediaCallActor,
	signal: { callId: IMediaCall['_id']; role: MediaSignal['role']; sequence: number; type: T; body: MediaSignalBody<T> },
): Promise<void> {
	if (actor.type !== 'user') {
		return;
	}

	const fullSignal = buildSignal(
		{
			role: signal.role,
			...('sessionId' in actor && { sessionId: actor.sessionId }),
			version: 1,
			sequence: signal.sequence,
			callId: signal.callId,
		},
		signal.type,
		signal.body,
	);

	logger.debug({ msg: 'sending signal to actor', actor, signal });
	await sendSignal(actor.id, fullSignal);
}
