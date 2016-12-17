Meteor.methods({
	'livechat:removeTrigger'(triggerId) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeTrigger' });
		}

		check(triggerId, String);

		return RocketChat.models.LivechatTrigger.removeById(triggerId);
	}
});
