/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * DS208: Avoid top-level this
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

import { Accounts } from 'meteor/accounts-base';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { Users } from '@rocket.chat/models';

/*
  A valid user will have exactly one of the following identification fields: id, username, or email
*/
const userValidator = Match.Where(function (user) {
	check(user, {
		id: Match.Optional(String),
		username: Match.Optional(String),
		email: Match.Optional(String),
	});

	if (Object.keys(user).length !== 1) {
		throw new Match.Error('User must have exactly one identifier field');
	}

	return true;
});

/*
  A password can be either in plain text or hashed
*/
const passwordValidator = Match.OneOf(String, {
	digest: String,
	algorithm: String,
});

/*
  Return a MongoDB query selector for finding the given user
*/
const getUserQuerySelector = function (user) {
	if (user.id) {
		return { _id: user.id };
	}
	if (user.username) {
		return { username: user.username };
	}
	if (user.email) {
		return { 'emails.address': user.email };
	}

	// We shouldn't be here if the user object was properly validated
	throw new Error('Cannot create selector from invalid user');
};

/*
  Log a user in with their password
*/
export class Auth {
	async loginWithPassword(user, password) {
		if (!user || !password) {
			throw new Meteor.Error(401, 'Unauthorized');
		}

		// Validate the login input types
		check(user, userValidator);
		check(password, passwordValidator);

		// Retrieve the user from the database
		const authenticatingUserSelector = getUserQuerySelector(user);
		const authenticatingUser = await Users.findOne(authenticatingUserSelector);

		if (!authenticatingUser) {
			throw new Meteor.Error(401, 'Unauthorized');
		}
		if (!(authenticatingUser.services != null ? authenticatingUser.services.password : undefined)) {
			throw new Meteor.Error(401, 'Unauthorized');
		}

		// Authenticate the user's password
		const passwordVerification = await Accounts._checkPasswordAsync(authenticatingUser, password);
		if (passwordVerification.error) {
			throw new Meteor.Error(401, 'Unauthorized');
		}

		// Add a new auth token to the user's account
		const authToken = Accounts._generateStampedLoginToken();
		const hashedToken = Accounts._hashLoginToken(authToken.token);
		Accounts._insertHashedLoginToken(authenticatingUser._id, { hashedToken });

		return { authToken: authToken.token, userId: authenticatingUser._id };
	}
}
