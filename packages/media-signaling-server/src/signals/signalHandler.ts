import type { IUser } from '@rocket.chat/core-typings';
import type { MediaSignal } from '@rocket.chat/media-signaling';

export type SignalHandler = (uid: IUser['_id'], signal: MediaSignal) => void;

let handler: SignalHandler | null = null;

export function setSignalHandler(handlerFn: SignalHandler): void {
	handler = handlerFn;
}

export async function sendSignal(toUid: IUser['_id'], signal: MediaSignal): Promise<void> {
	console.log('sendSignal', toUid, signal);

	if (!handler) {
		throw new Error('media-signaling-server-not-configured');
	}

	return handler(toUid, signal);
}
