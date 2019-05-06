import memoize from 'mem';

import { Users } from '../../../models';
import { settings } from '../../../settings';

const maxAgeInMS = 1000;

const getUserById = (uid) => Users.findOneById(uid, { fields: { name: 1 } });
const getUserByUsername = (username) => Users.findOneByUsernameExact(username, { fields: { name: 1 } });

const getNameOfUserById = memoize((uid) => {
	const user = getUserById(uid);
	return user && user.name;
}, { maxAge: maxAgeInMS });

const getNameOfUser = memoize((username) => {
	const user = getUserByUsername(username);
	return user && user.name;
}, { maxAge: maxAgeInMS });

export const composeMessageObjectWithUser = function(message, userId) {
	if (!message) {
		return message;
	}

	// only return starred field if user has it starred
	if (message.starred && Array.isArray(message.starred)) {
		message.starred = message.starred.filter((star) => star._id === userId);
	}

	// if not using real names, there is nothing to do
	if (!settings.get('UI_Use_Real_Name')) {
		return message;
	}

	// otherwise if using real names, append name field where it is needed

	if (message.u && message.u._id) {
		message.u.name = getNameOfUserById(message.u._id);
	}
	if (message.mentions && message.mentions.length) {
		message.mentions.forEach((mention) => mention.name = getNameOfUser(mention.username));
	}
	if (message.reactions && Object.keys(message.reactions).length) {
		Object.keys(message.reactions).forEach((reaction) => {
			const names = message.reactions[reaction].usernames.map(getNameOfUser);
			message.reactions[reaction].names = names;
		});
	}
	return message;
};
