import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { Users } from '../../../models';
import { hasPermission } from '../../../authorization';
import { RateLimiter, validateEmailDomain } from '../lib';

import { checkEmailAvailability } from '.';

const _setEmail = function(userId, email, shouldSendVerificationEmail = true) {
	email = s.trim(email);
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { function: '_setEmail' });
	}

	if (!email) {
		throw new Meteor.Error('error-invalid-email', 'Invalid email', { function: '_setEmail' });
	}

	validateEmailDomain(email);

	const user = Users.findOneById(userId);

	// User already has desired username, return
	if (user.emails && user.emails[0] && user.emails[0].address === email) {
		return user;
	}

	// Check email availability
	if (!checkEmailAvailability(email)) {
		throw new Meteor.Error('error-field-unavailable', `${ email } is already in use :(`, { function: '_setEmail', field: email });
	}

	// Set new email
	Users.setEmail(user._id, email);
	user.email = email;
	if (shouldSendVerificationEmail === true) {
		Meteor.call('sendConfirmationEmail', user.email);
	}
	return user;
};

export const setEmail = RateLimiter.limitFunction(_setEmail, 1, 60000, {
	0() { return !Meteor.userId() || !hasPermission(Meteor.userId(), 'edit-other-user-info'); }, // Administrators have permission to change others emails, so don't limit those
});
