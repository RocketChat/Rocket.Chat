Meteor.methods({
	'livechat:saveTrigger' (trigger) {
		console.log('[methods] livechat:saveTrigger -> '.green, 'arguments:', arguments);

		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error("not-authorized");
		}

		return RocketChat.models.LivechatTrigger.save(trigger);
	}
});
