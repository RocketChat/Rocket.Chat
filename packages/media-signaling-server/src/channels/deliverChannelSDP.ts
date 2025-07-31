import type { IMediaCallChannel } from '@rocket.chat/core-typings';
import type { MediaSignalSDP } from '@rocket.chat/media-signaling';

import { sendSignalToChannel } from '../signals/sendSignalToChannel';
import { validateChannelForSignals } from '../signals/validateChannelForSignals';

export async function deliverChannelSDP(channel: IMediaCallChannel, body: MediaSignalSDP): Promise<void> {
	validateChannelForSignals(channel);

	await sendSignalToChannel(channel, {
		type: 'sdp',
		body,
	});
}
