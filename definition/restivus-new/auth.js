/* eslint-disable prefer-const */
/*
   Return a MongoDB query selector for finding the given user
   A password can be either in plain text or hashed

   A valid user will have exactly one of the following identification fields: id, username, or email
*/

import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import _ from 'underscore';
import { Accounts } from 'meteor/accounts-base';

let getUserQuerySelector;
let passwordValidator;
let userValidator;

this.Auth || (this.Auth = {});

userValidator = Match.Where(function (user) {
	check(user, {
		id: Match.Optional(String),
		username: Match.Optional(String),
		email: Match.Optional(String),
	});
	if (_.keys(user).length === !1) {
		throw new Match.Error('User must have exactly one identifier field');
	}
	return true;
});

passwordValidator = Match.OneOf(String, {
	digest: String,
	algorithm: String,
});

getUserQuerySelector = function (user) {
	if (user.id) {
		return {
			_id: user.id,
		};
	}
	if (user.username) {
		return {
			username: user.username,
		};
	}
	if (user.email) {
		return {
			'emails.address': user.email,
		};
	}
	// We shouldn't be here if the user object was properly validated
	throw new Error('Cannot create selector from invalid user');
};

// Log a user in with their password

this.Auth.loginWithPassword = function (user, password) {
	let authToken;
	let authenticatingUser;
	let authenticatingUserSelector;
	let hashedToken;
	let passwordVerification;
	let ref;
	if (!user || !password) {
		throw new Meteor.Error(401, 'Unauthorized');
	}
	// Validate the login input types
	check(user, userValidator);
	check(password, passwordValidator);
	// Retrieve the user from the database
	authenticatingUserSelector = getUserQuerySelector(user);
	authenticatingUser = Meteor.users.findOne(authenticatingUserSelector);
	if (!authenticatingUser) {
		throw new Meteor.Error(401, 'Unauthorized');
	}
	if (!((ref = authenticatingUser.services) != null ? ref.password : undefined)) {
		throw new Meteor.Error(401, 'Unauthorized');
	}
	// Authenticate the user's password
	passwordVerification = Accounts._checkPassword(authenticatingUser, password);
	if (passwordVerification.error) {
		throw new Meteor.Error(401, 'Unauthorized');
	}
	// Add a new auth token to the user's account
	authToken = Accounts._generateStampedLoginToken();
	hashedToken = Accounts._hashLoginToken(authToken.token);
	Accounts._insertHashedLoginToken(authenticatingUser._id, { hashedToken });
	return {
		authToken: authToken.token,
		userId: authenticatingUser._id,
	};
};
