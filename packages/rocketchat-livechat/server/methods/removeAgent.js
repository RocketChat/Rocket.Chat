Meteor.methods({
	'livechat:removeAgent'(username) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('not-authorized');
		}

		if (!username || !_.isString(username)) {
			throw new Meteor.Error('invalid-arguments');
		}

		var user = RocketChat.models.Users.findOneByUsername(username, { fields: { _id: 1 } });

		if (!user) {
			throw new Meteor.Error('user-not-found', 'Username_not_found');
		}

		if (RocketChat.authz.removeUserFromRoles(user._id, 'livechat-agent')) {
			RocketChat.models.Users.setOperator(user._id, false);
			RocketChat.models.Users.setLivechatStatus(user._id, 'not-available');
			return true;
		}

		return false;
	}
});
