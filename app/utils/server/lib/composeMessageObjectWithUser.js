import { Users } from '../../../models';
import { settings } from '../../../settings';
import memoize from 'mem';

const maxAgeInMS = 1000;

const getUserByUsername = (username) => Users.findOneByUsername(username, { fields: { name: 1 } });
const getNameOfUser = memoize((username) => {
	const user = getUserByUsername(username);
	return user ? user.name : undefined;
}, { maxAge: maxAgeInMS });

export const composeMessageObjectWithUser = function(message, userId) {
	if (message) {
		if (message.starred && Array.isArray(message.starred)) {
			message.starred = message.starred.filter((star) => star._id === userId);
		}
		if (settings.get('UI_Use_Real_Name')) {
			if (message.u && message.u._id) {
				message.u.name = getNameOfUser(message.u.username);
			}
			if (message.mentions && message.mentions.length) {
				message.mentions.forEach((mention) => { mention.name = getNameOfUser(mention.username); });
			}
			if (message.reactions && Object.keys(message.reactions).length) {
				Object.keys(message.reactions).forEach((reaction) => {
					const names = message.reactions[reaction].usernames.map(getNameOfUser);
					message.reactions[reaction].names = names;
				});
			}
		}
	}
	return message;
};
