import type { Dispatch, SetStateAction } from 'react';
import { useMemo } from 'react';

import type { ChannelDescriptor } from './PrepareChannels';
import type { UserDescriptor } from './PrepareUsers';

export type MessageDescriptor = {
	_id?: string;
	rid: string;
	u: {
		_id: string;
	};
};

const useMessagesCount = (
	users: UserDescriptor[],
	channels: ChannelDescriptor[],
	messages: MessageDescriptor[],
	setMessageCount: Dispatch<SetStateAction<number>>,
) => {
	useMemo(() => {
		let messageCount = 0;

		const selectedUsers = new Set(users.map((user) => user.user_id));
		const selectedChannels = new Set(channels.map((channel) => channel.channel_id));

		for (const message of messages) {
			if (selectedUsers.has(message.u._id) || selectedChannels.has(message.rid)) {
				messageCount++;
			}
		}

		setMessageCount(messageCount);
	}, [users, channels, setMessageCount, messages]);
};

export default useMessagesCount;
