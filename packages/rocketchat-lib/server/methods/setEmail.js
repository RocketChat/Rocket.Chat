Meteor.methods({
	setEmail: function(email) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('invalid-user', '[methods] setEmail -> Invalid user');
		}

		const user = Meteor.user();

		if (!RocketChat.settings.get('Accounts_AllowEmailChange')) {
			throw new Meteor.Error(403, '[methods] setEmail -> E-mail change not allowed');
		}

		if (user.emails && user.emails[0] && user.emails[0].address === email) {
			return email;
		}

		if (!RocketChat.setEmail(user._id, email)) {
			throw new Meteor.Error('could-not-change-email', 'Could not change email');
		}

		return email;
	}
});

RocketChat.RateLimiter.limitMethod('setEmail', 1, 1000, {
	userId: function(/*userId*/) { return true; }
});
