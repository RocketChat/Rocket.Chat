Meteor.methods({
	'livechat:removeManager'(username) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeManager' });
		}

		return RocketChat.Livechat.removeManager(username);
	}
});
