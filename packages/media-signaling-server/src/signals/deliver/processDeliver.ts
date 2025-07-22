import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalDeliver } from '@rocket.chat/media-signaling';

import { processSDP } from './sdp';

export async function processDeliver(signal: MediaSignalDeliver, call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
	switch (signal.body.deliver) {
		case 'sdp':
			return processSDP(signal as MediaSignalDeliver<'sdp'>, call, channel);
	}
}
