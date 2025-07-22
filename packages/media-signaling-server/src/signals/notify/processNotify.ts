import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalNotify } from '@rocket.chat/media-signaling';

import { processAccept } from './accept';
import { processACK } from './ack';

export async function processNotify(signal: MediaSignalNotify, call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
	switch (signal.body.notify) {
		case 'ack':
			return processACK(signal as MediaSignalNotify<'ack'>, call, channel);
		case 'accept':
			return processAccept(signal as MediaSignalNotify<'accept'>, call, channel);
	}
}
