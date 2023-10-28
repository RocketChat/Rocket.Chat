import { useMemo } from 'react';

const useMessagesCount = (users, channels, messages, setMessageCount) => {
	useMemo(() => {
		let messageCount = 0;

		const selectedUsers = new Set(users.map((user) => user._id));
		const selectedChannels = new Set(users.map((channel) => channel._id));

		for (const message of messages) {
			if (selectedUsers.has(message.u._id) || selectedChannels.has(message.rid)) {
				messageCount++;
			}
		}

		setMessageCount(messageCount);
	}, [users, setMessageCount, messages]);
};

export default useMessagesCount;
