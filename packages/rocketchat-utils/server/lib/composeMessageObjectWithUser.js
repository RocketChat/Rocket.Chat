import { Users } from 'meteor/rocketchat:models';
import { settings } from 'meteor/rocketchat:settings';

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
		if (message.u && message.u.name && !settings.get('UI_Use_Real_Name')) {
			delete message.u.name;
		}
		if (message.mentions && message.mentions.length && !settings.get('UI_Use_Real_Name')) {
			message.mentions.forEach((mention) => {
				delete mention.name;
			});
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
