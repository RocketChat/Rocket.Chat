import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMediaSignal } from '@rocket.chat/media-signaling';

import { logger } from './logger';

export type SignalHandler = (uid: IUser['_id'], signal: ServerMediaSignal) => void;

let handler: SignalHandler | null = null;

export function setSignalHandler(handlerFn: SignalHandler): void {
	handler = handlerFn;
}

export async function sendSignal(toUid: IUser['_id'], signal: ServerMediaSignal): Promise<void> {
	logger.debug({ msg: 'sendSignal', toUid, signal });

	if (!handler) {
		throw new Error('media-signaling-server-not-configured');
	}

	return handler(toUid, signal);
}
