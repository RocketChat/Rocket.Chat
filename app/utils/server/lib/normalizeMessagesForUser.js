import { Users } from '../../../models/server';
import { settings } from '../../../settings/server';

const filterStarred = (message, uid) => {
	// only return starred field if user has it starred
	if (message.starred && Array.isArray(message.starred)) {
		message.starred = message.starred.filter((star) => star._id === uid);
	}
	return message;
};

// TODO: we should let clients get user names on demand instead of doing this

export const normalizeMessagesForUser = (messages, uid) => {
	// if not using real names, there is nothing else to do
	if (!settings.get('UI_Use_Real_Name')) {
		return messages.map((message) => filterStarred(message, uid));
	}

	const usernames = new Set();

	messages.forEach((message) => {
		message = filterStarred(message, uid);

		usernames.add(message.u.username);

		(message.mentions || []).forEach(({ username }) => { usernames.add(username); });

		Object.values(message.reactions || {})
			.forEach((reaction) => reaction.usernames.forEach((username) => usernames.add(username)));
	});

	const users = {};

	Users.findUsersByUsernames([...usernames.values()], {
		fields: {
			username: 1,
			name: 1,
		},
	}).forEach((user) => {
		users[user.username] = user.name;
	});

	messages.forEach((message) => {
		message.u.name = users[message.u.username];

		(message.mentions || []).forEach((mention) => { mention.name = users[mention.username]; });

		Object.keys(message.reactions || {}).forEach((reaction) => {
			const names = message.reactions[reaction].usernames.map((username) => users[username]);
			message.reactions[reaction].names = names;
		});
	});

	return messages;
};
