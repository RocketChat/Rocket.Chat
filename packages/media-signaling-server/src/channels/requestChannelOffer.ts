import type { IMediaCallChannel } from '@rocket.chat/core-typings';
import type { RequestParams } from '@rocket.chat/media-signaling';

import { getNewCallSequence } from '../calls/getNewCallSequence';
import { sendSignalToChannel } from '../signals/sendSignalToChannel';
import { validateChannelForSignals } from '../signals/validateChannelForSignals';

export async function requestChannelOffer(channel: IMediaCallChannel, params?: RequestParams<'offer'>): Promise<void> {
	// If the channel already has a local Sdp, no need to request its offer unless we're restarting ICE
	if (channel.webrtc?.local && !params?.iceRestart) {
		return;
	}

	validateChannelForSignals(channel);

	const call = await getNewCallSequence(channel.callId);

	await sendSignalToChannel(channel, {
		sequence: call.sequence,
		type: 'request',
		body: {
			request: 'offer',
			...params,
		},
	});
}
