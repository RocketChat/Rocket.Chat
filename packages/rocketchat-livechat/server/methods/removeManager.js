Meteor.methods({
	'livechat:removeManager'(username) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('not-authorized');
		}

		check(username, String);

		var user = RocketChat.models.Users.findOneByUsername(username, { fields: { _id: 1 } });

		if (!user) {
			throw new Meteor.Error('user-not-found', 'Username_not_found');
		}

		return RocketChat.authz.removeUserFromRoles(user._id, 'livechat-manager');
	}
});
