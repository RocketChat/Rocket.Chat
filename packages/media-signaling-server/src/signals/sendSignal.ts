import type { MediaSignal } from '@rocket.chat/media-signaling';

export async function sendSignal(signal: MediaSignal): Promise<void> {
	console.log('sendSignal', signal);
}
