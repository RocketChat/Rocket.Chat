import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalNotify } from '@rocket.chat/media-signaling';

import { acknowledgeCallee } from '../../calls/acknowledgeCallee';
// import { acknowledgeCaller } from '../../calls/acknowledgeCaller';

export async function processACK(_signal: MediaSignalNotify<'ack'>, call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
	switch (channel.role) {
		case 'callee':
			return acknowledgeCallee(call, channel);
		// case 'caller':
		// 	return acknowledgeCaller(call, channel);
	}
}
