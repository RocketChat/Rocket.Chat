Meteor.methods({
	'livechat:saveTrigger'(trigger) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveTrigger' });
		}

		return RocketChat.models.LivechatTrigger.save(trigger);
	}
});
