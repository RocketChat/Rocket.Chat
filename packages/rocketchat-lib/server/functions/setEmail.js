RocketChat._setEmail = function(userId, email) {
	email = s.trim(email);
	if (!userId) {
		throw new Meteor.Error('invalid-user', '[methods] setEmail -> Invalid user');
	}

	if (!email) {
		throw new Meteor.Error('invalid-email', '[methods] setEmail -> Invalid email');
	}

	const emailValidation = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
	if (!emailValidation.test(email)) {
		throw new Meteor.Error('email-invalid', email + ' is not a valid e-mail');
	}

	const user = RocketChat.models.Users.findOneById(userId);

	// User already has desired username, return
	if (user.emails && user.emails[0] && user.emails[0].address === email) {
		return user;
	}

	// Check e-mail availability
	if (!RocketChat.checkEmailAvailability(email)) {
		throw new Meteor.Error('email-unavailable', email + ' is already in use :(');
	}

	// Set new email
	RocketChat.models.Users.setEmail(user._id, email);
	user.email = email;
	return user;
};

RocketChat.setEmail = RocketChat.RateLimiter.limitFunction(RocketChat._setEmail, 1, 60000, {
	0: function(userId) { return !RocketChat.authz.hasPermission(userId, 'edit-other-user-info'); } // Administrators have permission to change others emails, so don't limit those
});
