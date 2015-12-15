Meteor.methods({
	'livechat:removeTrigger' (trigger) {
		console.log('[methods] livechat:removeTrigger -> '.green, 'arguments:', arguments);

		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error("not-authorized");
		}

		return RocketChat.models.LivechatTrigger.removeAll();
	}
});
