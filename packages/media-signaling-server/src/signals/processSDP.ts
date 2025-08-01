import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalSDP } from '@rocket.chat/media-signaling';
import { MediaCallChannels } from '@rocket.chat/models';

import { deliverChannelSDP } from '../channels/deliverChannelSDP';
import { getOppositeChannel } from '../channels/getOppositeChannel';

export async function processSDP(params: MediaSignalSDP, call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
	console.log('processSDP');

	// Save the SDP for the local session of the channel
	await MediaCallChannels.setLocalDescription(channel._id, params.sdp);

	// Find the opposite channel and send them the SDP as remote
	const otherChannel = await getOppositeChannel(call, channel);
	// otherChannel will only be defined if the other participant has already accepted the call
	if (otherChannel) {
		await deliverChannelSDP(otherChannel, params);
	}
}
