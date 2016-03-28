Meteor.methods({
	'livechat:searchAgent' (username) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('not-authorized');
		}

		if (!username || !_.isString(username)) {
			throw new Meteor.Error('invalid-arguments');
		}

		var user = RocketChat.models.Users.findOneByUsername(username, { fields: { _id: 1, username: 1 } });

		if (!user) {
			throw new Meteor.Error('user-not-found', 'Username_not_found');
		}

		return user;
	}
});
