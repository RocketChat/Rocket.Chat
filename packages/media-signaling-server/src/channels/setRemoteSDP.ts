import type { IMediaCallChannel } from '@rocket.chat/core-typings';
import type { DeliverParams } from '@rocket.chat/media-signaling';
import { MediaCallChannels } from '@rocket.chat/models';

import { deliverChannelSDP } from './deliverChannelSDP';

export async function setRemoteSDP(channel: IMediaCallChannel, params: DeliverParams<'sdp'>, sequence: number): Promise<void> {
	const result = await MediaCallChannels.setRemoteWebRTCSession(channel._id, {
		description: params.sdp,
		iceCandidates: [],
		iceGatheringComplete: Boolean(params.endOfCandidates),
		assignSequence: sequence,
	});
	if (!result.modifiedCount) {
		console.log('remote sdp NOT changed for ', channel.role);
		return;
	}
	console.log('remote sdp changed for ', channel.role);

	if (channel.participant.type !== 'user') {
		// No need to send any signals if the remote participant is not a rocket.chat user
		return;
	}

	await deliverChannelSDP(channel, {
		sdp: params.sdp,
		endOfCandidates: params.endOfCandidates,
	});

	// #ToDo: deliver ice candidates
}
