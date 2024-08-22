import type { IMessage } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { settings } from '../../../settings/server';

const filterStarred = (message: IMessage, uid?: string): IMessage => {
	// if Allow_anonymous_read is enabled, uid will be undefined
	if (!uid) return message;

	// only return starred field if user has it starred
	if (message.starred && Array.isArray(message.starred)) {
		message.starred = message.starred.filter((star) => star._id === uid);
	}
	return message;
};

// TODO: we should let clients get user names on demand instead of doing this

function getNameOfUsername(users: Map<string, string>, username: string): string {
	return users.get(username) || username;
}

export const normalizeMessagesForUser = async (messages: IMessage[], uid?: string): Promise<IMessage[]> => {
	// if not using real names, there is nothing else to do
	if (!settings.get('UI_Use_Real_Name')) {
		return messages.map((message) => filterStarred(message, uid));
	}

	const usernames: Set<string> = new Set();

	messages.forEach((message) => {
		message = filterStarred(message, uid);

		if (!message.u?.username) {
			return;
		}
		usernames.add(message.u.username);

		(message.mentions || []).forEach(({ username }) => {
			if (username) {
				usernames.add(username);
			}
		});

		Object.values(message.reactions || {}).forEach((reaction) => reaction.usernames.forEach((username) => usernames.add(username)));
	});

	const names = new Map();

	(
		await Users.findUsersByUsernames([...usernames.values()], {
			projection: {
				username: 1,
				name: 1,
			},
		}).toArray()
	).forEach((user) => {
		names.set(user.username, user.name);
	});

	messages.forEach((message: IMessage) => {
		if (!message.u) {
			return;
		}
		message.u.name = getNameOfUsername(names, message.u.username);

		(message.mentions || []).forEach((mention) => {
			if (mention.username) {
				mention.name = getNameOfUsername(names, mention.username);
			}
		});

		if (!message.reactions) {
			return messages;
		}

		message.reactions = Object.fromEntries(
			Object.entries(message.reactions).map(([keys, reaction]) => {
				reaction.names = reaction.usernames.map((username) => getNameOfUsername(names, username));
				return [keys, reaction];
			}),
		);
	});

	return messages;
};
