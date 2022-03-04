/* eslint-disable prefer-const */
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import { Accounts } from 'meteor/accounts-base';

import { IUser, IUserEmail } from '../../../../../definition/IUser';

/*
  Return a MongoDB query selector for finding the given user
  A password can be either in plain text or hashed
  
  A valid user will have exactly one of the following identification fields: id, username, or email
*/
let getUserQuerySelector: (
	user: IUser,
) =>
	| { '_id': string; 'username'?: undefined; 'emails.address'?: undefined }
	| { 'username': string; '_id'?: undefined; 'emails.address'?: undefined }
	| { 'emails.address': IUserEmail[]; '_id'?: undefined; 'username'?: undefined };
let passwordValidator: Match.Matcher<string | { digest: string; algorithm: string }>;
let userValidator: Match.Matcher<undefined>;

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const Auth = {} || (this! as any).Auth;
// this.Auth || (this.Auth = {});

userValidator = Match.Where(function (user) {
	check(user, {
		id: Match.Optional(String),
		username: Match.Optional(String),
		email: Match.Optional(String),
	});
	if (_.keys(user).length !== 1) {
		throw new Meteor.Error('User must have exactly one identifier field');
	}
	return true;
});

passwordValidator = Match.OneOf(String, {
	digest: String,
	algorithm: String,
});

getUserQuerySelector = function (user: IUser):
	| {
			'_id': string;
			'username'?: undefined;
			'emails.address'?: undefined;
	  }
	| {
			'username': string;
			'_id'?: undefined;
			'emails.address'?: undefined;
	  }
	| {
			'emails.address': IUserEmail[];
			'_id'?: undefined;
			'username'?: undefined;
	  } {
	if (user._id) {
		return {
			_id: user._id,
		};
	}
	if (user.username) {
		return {
			username: user.username,
		};
	}
	if (user.emails) {
		return {
			'emails.address': user.emails,
		};
	}
	// We shouldn't be here if the user object was properly validated
	throw new Error('Cannot create selector from invalid user');
};

// Log a user in with their password
Auth.loginWithPassword = function (
	user: IUser,
	password: Accounts.Password,
): {
	authToken: string;
	userId: string;
} {
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
	Accounts._insertHashedLoginToken(authenticatingUser._id, {
		hashedToken,
		when: new Date(),
	});
	return {
		authToken: authToken.token,
		userId: authenticatingUser._id,
	};
};
