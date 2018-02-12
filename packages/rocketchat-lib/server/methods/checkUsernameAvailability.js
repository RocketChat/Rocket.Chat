Meteor.methods({
	checkUsernameAvailability(username) {
		check(username, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setUsername' });
		}

		const user = Meteor.user();

		if (user.username && !RocketChat.settings.get('Accounts_AllowUsernameChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setUsername' });
		}

		if (user.username === username) {
			return true;
		}
		return RocketChat.checkUsernameAvailability(username);
	}
});

RocketChat.RateLimiter.limitMethod('checkUsernameAvailability', 1, 1000, {
	userId() { return true; }
});
