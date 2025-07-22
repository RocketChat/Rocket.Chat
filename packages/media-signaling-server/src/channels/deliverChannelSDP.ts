import type { IMediaCallChannel } from '@rocket.chat/core-typings';
import type { DeliverParams } from '@rocket.chat/media-signaling';

import { getNewCallSequence } from '../calls/getNewCallSequence';
import { sendSignalToChannel } from '../signals/sendSignalToChannel';
import { validateChannelForSignals } from '../signals/validateChannelForSignals';

export async function deliverChannelSDP(channel: IMediaCallChannel, params: DeliverParams<'sdp'>): Promise<void> {
	validateChannelForSignals(channel);

	const call = await getNewCallSequence(channel.callId);

	// If the sdp is an offer, send an answer request, otherwise simply deliver it
	if (params.sdp.type === 'offer') {
		await sendSignalToChannel(channel, {
			sequence: call.sequence,
			type: 'request',
			body: {
				request: 'answer',
				offer: params.sdp,
			},
		});
	} else {
		await sendSignalToChannel(channel, {
			sequence: call.sequence,
			type: 'deliver',
			body: {
				deliver: 'sdp',
				...params,
			},
		});
	}
}
