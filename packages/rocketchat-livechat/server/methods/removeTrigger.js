Meteor.methods({
	'livechat:removeTrigger'(/*trigger*/) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeTrigger' });
		}

		return RocketChat.models.LivechatTrigger.removeAll();
	}
});
