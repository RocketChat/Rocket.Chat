const getUser = (userId) => RocketChat.models.Users.findOneById(userId);

RocketChat.composeMessageObjectWithUser = function(message, userId) {
	if (message) {
		if (message.starred && Array.isArray(message.starred)) {
			message.starred = message.starred.filter((star) => star._id === userId);
		}
		if (message.u && message.u._id && RocketChat.settings.get('UI_Use_Real_Name')) {
			const user = getUser(message.u._id);
			message.u.name = user && user.name;
		}
		if (message.mentions && message.mentions.length && RocketChat.settings.get('UI_Use_Real_Name')) {
			message.mentions.forEach((mention) => {
				const user = getUser(mention._id);
				mention.name = user && user.name;
			});
		}
	}
	return message;
};
