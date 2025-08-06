import type { IUser } from '@rocket.chat/core-typings';
import type { MediaSignal, ServerMediaSignal, ServerMediaSignalType } from '@rocket.chat/media-signaling';

export type SignalHandler = (uid: IUser['_id'], signal: ServerMediaSignal) => void;

let handler: SignalHandler | null = null;

export function setSignalHandler(handlerFn: SignalHandler): void {
	handler = handlerFn;
}

export async function sendSignal<T extends ServerMediaSignalType>(toUid: IUser['_id'], signal: MediaSignal<T>): Promise<void> {
	console.log('sendSignal', toUid, signal);

	if (!handler) {
		throw new Error('media-signaling-server-not-configured');
	}

	return handler(toUid, signal);
}
