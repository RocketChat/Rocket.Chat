Meteor.methods({
	'livechat:saveTrigger' (trigger) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('not-authorized');
		}

		return RocketChat.models.LivechatTrigger.save(trigger);
	}
});
