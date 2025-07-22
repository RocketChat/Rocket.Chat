import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalNotify } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { requestChannelOffer } from '../../channels/requestChannelOffer';

export async function processACK(_signal: MediaSignalNotify<'ack'>, call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
	// If the call is still on an empty state and a signal reached a callee, change the state to 'ringing'

	if (channel.role === 'callee' && call.state === 'none') {
		const result = await MediaCalls.startRingingById(call._id);

		// If the state was changed, request an offer from the caller
		if (result.modifiedCount) {
			await requestChannelOffer(channel);
		}
	}
}
