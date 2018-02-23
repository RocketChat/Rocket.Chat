Meteor.methods({
	setUserPassword(password) {
		check(password, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setUserPassword'
			});
		}

		const user = RocketChat.models.Users.findOneById(userId);

		if (user && user.requirePasswordChange !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setUserPassword'
			});
		}

		RocketChat.validatePasswordPolicy(password);

		Accounts.setPassword(userId, password, {
			logout: false
		});

		return RocketChat.models.Users.unsetRequirePasswordChange(userId);
	}
});
