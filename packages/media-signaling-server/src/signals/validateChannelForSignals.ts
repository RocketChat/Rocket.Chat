import type { IMediaCallChannel, ValidSignalChannel } from '@rocket.chat/core-typings';

export function validateChannelForSignals(channel: IMediaCallChannel): asserts channel is ValidSignalChannel {
	if (channel.participant.type !== 'user') {
		throw new Error('not-implemented');
	}
	if (!channel.participant.sessionId) {
		throw new Error('SDP may only be sent to specific user sessions.');
	}
}
