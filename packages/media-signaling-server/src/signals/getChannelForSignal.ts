import type { IMediaCallChannel, ValidSignalChannel } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { MediaCallChannels } from '@rocket.chat/models';

export async function getChannelForSignal(
	channelData: Pick<IMediaCallChannel, 'participant' | 'callId' | 'role'>,
): Promise<ValidSignalChannel> {
	console.log('getChannelForSignal', channelData.role);
	const newChannel: InsertionModel<IMediaCallChannel> = {
		...channelData,
		state: 'none',
		acknowledged: true,
	};

	// Create this channel if it doesn't yet exist, or update it with ack = true if it does
	const insertedChannel = await MediaCallChannels.createOrUpdateChannel(newChannel);
	if (!insertedChannel) {
		throw new Error('failed-to-insert-channel');
	}

	return insertedChannel as ValidSignalChannel;
}
