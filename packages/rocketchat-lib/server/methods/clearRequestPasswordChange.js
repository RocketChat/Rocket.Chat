Meteor.methods({
	clearRequestPasswordChange: function() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('invalid-user', "[methods] clearRequestPasswordChange -> Invalid user");
		}

		return RocketChat.models.Users.unsetRequirePasswordChange(Meteor.userId());
	}
})