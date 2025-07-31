import type { IMediaCallChannel } from '@rocket.chat/core-typings';
import type { MediaSignalRequestOffer } from '@rocket.chat/media-signaling';

import { sendSignalToChannel } from '../signals/sendSignalToChannel';
import { validateChannelForSignals } from '../signals/validateChannelForSignals';

export async function requestChannelOffer(channel: IMediaCallChannel, params: MediaSignalRequestOffer): Promise<void> {
	// If the channel already has a local Sdp, no need to request its offer unless we're restarting ICE
	if (channel.localDescription?.sdp && !params.iceRestart) {
		return;
	}

	validateChannelForSignals(channel);

	await sendSignalToChannel(channel, {
		type: 'request-offer',
		body: params,
	});
}
