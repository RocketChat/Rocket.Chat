Meteor.methods({
	clearRequirePasswordChange: function() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('invalid-user', '[methods] clearRequirePasswordChange -> Invalid user');
		}

		return RocketChat.models.Users.unsetRequirePasswordChange(Meteor.userId());
	}
});
