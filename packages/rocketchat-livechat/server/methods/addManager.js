Meteor.methods({
	'livechat:addManager'(username) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:addManager' });
		}

		return RocketChat.Livechat.addManager(username);
	}
});
