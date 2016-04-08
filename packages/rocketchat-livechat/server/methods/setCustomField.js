Meteor.methods({
	'livechat:setCustomField' (token, key, value) {
		return RocketChat.models.LivechatCustomField.saveByToken(token, key, value);
	}
});
