import type { ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalBody, MediaSignalType } from '@rocket.chat/media-signaling';

import { sendSignalToChannel } from './sendSignalToChannel';

export async function sendSignalToChannels<T extends MediaSignalType>(
	channel: ValidSignalChannel[],
	signal: { sequence: number; type: T; body: MediaSignalBody<T> },
): Promise<void> {
	await Promise.all(channel.map((channel) => sendSignalToChannel(channel, signal)));
}
