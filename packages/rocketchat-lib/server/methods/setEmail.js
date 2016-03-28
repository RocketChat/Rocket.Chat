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

		const emailValidation = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
		if (!emailValidation.test(email)) {
			throw new Meteor.Error('email-invalid', email + ' is not a valid e-mail');
		}

		if (!RocketChat.checkEmailAvailability(email)) {
			throw new Meteor.Error('email-unavailable', email + ' is already in use :(');
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
