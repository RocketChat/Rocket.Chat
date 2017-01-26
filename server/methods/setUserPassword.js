Meteor.methods({
	setUserPassword(password) {
		check(password, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setUserPassword'
			});
		}

		const userId = Meteor.userId();
		const user = RocketChat.models.Users.findOneById(userId);

		if (user && user.requirePasswordChange !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setUserPassword'
			});
		}

		Accounts.setPassword(userId, password, {
			logout: false
		});

		return RocketChat.models.Users.unsetRequirePasswordChange(userId);
	}
});
