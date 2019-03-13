import { Users } from '/app/models';
import { settings } from '/app/settings';

const getUserByUsername = (username) => Users.findOneByUsername(username, { fields: { name: 1 } });
const getNameOfUser = (username) => {
	const user = getUserByUsername(username);
	return user ? user.name : undefined;
};

export const composeMessageObjectWithUser = function(message, userId) {
	if (message) {
		if (message.starred && Array.isArray(message.starred)) {
			message.starred = message.starred.filter((star) => star._id === userId);
		}
		if (message.u && message.u._id && settings.get('UI_Use_Real_Name')) {
			message.u.name = getNameOfUser(message.u.username);
		}
		if (message.mentions && message.mentions.length && settings.get('UI_Use_Real_Name')) {
			message.mentions.forEach((mention) => mention.name = getNameOfUser(mention.username));
		}
		if (message.reactions && Object.keys(message.reactions).length && settings.get('UI_Use_Real_Name')) {
			Object.keys(message.reactions).forEach((reaction) => {
				const names = message.reactions[reaction].usernames.map(getNameOfUser);
				message.reactions[reaction].names = names;
			});
		}
	}
	return message;
};
