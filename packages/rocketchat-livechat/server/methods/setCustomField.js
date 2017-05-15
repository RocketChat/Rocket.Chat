Meteor.methods({
	'livechat:setCustomField'(token, key, value, overwrite = true) {
		const customField = RocketChat.models.LivechatCustomField.findOneById(key);
		if (customField) {
			if (customField.scope === 'room') {
				return RocketChat.models.Rooms.updateLivechatDataByToken(token, key, value, overwrite);
			} else {
				// Save in user
				return RocketChat.models.Users.updateLivechatDataByToken(token, key, value, overwrite);
			}
		}

		return true;
	}
});
