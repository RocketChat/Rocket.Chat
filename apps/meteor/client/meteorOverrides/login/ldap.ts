import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import type { LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { reportError } from '../../lib/2fa/utils';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithLDAPAndTOTP(
			username: string | { username: string } | { email: string } | { id: string },
			ldapPass: string,
			code: string,
			callback?: LoginCallback,
		): void;

		function loginWithLDAP(
			username: string | { username: string } | { email: string } | { id: string },
			ldapPass: string,
			callback?: LoginCallback,
		): void;
	}
}

Meteor.loginWithLDAP = function (username, password, callback) {
	Accounts.callLoginMethod({
		methodArguments: [
			{
				ldap: true,
				username,
				ldapPass: password,
				ldapOptions: {},
			},
		],
		userCallback: callback,
	});
};

Meteor.loginWithLDAPAndTOTP = function (...args) {
	// Pull username and password
	const username = args.shift();
	const ldapPass = args.shift();

	// Check if last argument is a function. if it is, pop it off and set callback to it
	const callback = typeof args[args.length - 1] === 'function' ? (args.pop() as LoginCallback) : undefined;
	// The last argument before the callback is the totp code
	const code = args.pop();

	// if args still holds options item, grab it
	const ldapOptions = args.length > 0 ? args.shift() : {};

	// Set up loginRequest object
	const loginRequest = {
		ldap: true,
		username,
		ldapPass,
		ldapOptions,
	};

	Accounts.callLoginMethod({
		methodArguments: [
			{
				totp: {
					login: loginRequest,
					code,
				},
			},
		],
		userCallback(error) {
			if (error) {
				reportError(error, callback);
			} else {
				callback?.(undefined);
			}
		},
	});
};

const { loginWithLDAP } = Meteor;

Meteor.loginWithLDAP = function (...args) {
	const callback = typeof args[args.length - 1] === 'function' ? (args.pop() as LoginCallback) : undefined;

	overrideLoginMethod(loginWithLDAP, args as any, callback, Meteor.loginWithLDAPAndTOTP, args[0] as string | undefined);
};
