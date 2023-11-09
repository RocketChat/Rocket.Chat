import type { ChannelDescriptor } from './PrepareChannels';
import type { UserDescriptor } from './PrepareUsers';

export type MessageDescriptor = {
	_id?: string;
	rid: string;
	u: {
		_id: string;
	};
};

export const countMessages = (users: UserDescriptor[], channels: ChannelDescriptor[], messages: MessageDescriptor[]): number => {
	let messageCount = 0;

	const selectedUsers = new Set(users.map((user) => user.user_id));
	const selectedChannels = new Set(channels.map((channel) => channel.channel_id));

	for (const message of messages) {
		if (selectedUsers.has(message.u._id) || selectedChannels.has(message.rid)) {
			messageCount++;
		}
	}

	return messageCount;
};
