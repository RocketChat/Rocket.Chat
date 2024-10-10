import type { ChannelDescriptor } from './ChannelDescriptor';
import type { UserDescriptor } from './UserDescriptor';

export type MessageDescriptor = {
	_id?: string;
	rid: string;
	u: string;
};

export const countMessages = (users: UserDescriptor[], channels: ChannelDescriptor[], messages: MessageDescriptor[]): number => {
	let messageCount = 0;

	const selectedUsers = new Set(users.map((user) => user.user_id));
	const selectedChannels = new Set(channels.map((channel) => channel.channel_id));

	for (const message of messages) {
		if (selectedUsers.has(message.u) || selectedChannels.has(message.rid)) {
			messageCount++;
		}
	}

	return messageCount;
};
