import type { IMediaCallChannel, ValidSignalChannel } from '@rocket.chat/core-typings';

export function isValidSignalChannel(channel: IMediaCallChannel): channel is ValidSignalChannel {
	return channel.participant.type === 'user';
}
