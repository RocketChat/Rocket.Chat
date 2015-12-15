Meteor.methods({
	'livechat:removeManager' (username) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error("not-authorized");
		}

		check(username, String);

		console.log('[methods] livechat:removeManager -> '.green, 'arguments:', arguments);

		var user = RocketChat.models.Users.findOneByUsername(username, { fields: { _id: 1 } });

		if (!user) {
			throw new Meteor.Error('user-not-found', 'Username_not_found');
		}

		return RocketChat.authz.removeUsersFromRoles(user._id, 'livechat-manager');
	}
});
