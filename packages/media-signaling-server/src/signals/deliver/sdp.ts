import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalDeliver } from '@rocket.chat/media-signaling';
import { MediaCallChannels } from '@rocket.chat/models';

import { getOppositeChannel } from '../../channels/getOppositeChannel';
import { setRemoteSDP } from '../../channels/setRemoteSDP';

export async function processSDP(signal: MediaSignalDeliver<'sdp'>, call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
	// Save the SDP for the local session of the channel
	await MediaCallChannels.setLocalWebRTCSession(channel._id, {
		description: signal.body.sdp,
		iceCandidates: [],
		iceGatheringComplete: Boolean(signal.body.endOfCandidates),
		assignSequence: signal.sequence,
	});

	// Find the opposite channel and save the SDP there as well
	const otherChannel = await getOppositeChannel(call, channel);
	if (otherChannel) {
		await setRemoteSDP(
			otherChannel,
			{
				sdp: signal.body.sdp,
				endOfCandidates: Boolean(signal.body.endOfCandidates),
			},
			signal.sequence,
		);
	}
}
