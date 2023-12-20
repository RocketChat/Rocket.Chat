import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import type { LoginCallback } from '../../lib/2fa/overrideLoginMethod';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithLDAP(
			username: string | { username: string } | { email: string } | { id: string },
			ldapPass: string,
			callback?: LoginCallback,
		): void;
	}
}

const loginWithLDAPAndTOTP = (
	username: string | { username: string } | { email: string } | { id: string },
	ldapPass: string,
	code: string,
	callback?: LoginCallback,
) => {
	const loginRequest = {
		ldap: true,
		username,
		ldapPass,
		ldapOptions: {},
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
				if (callback) {
					callback(error);
					return;
				}

				throw error;
			} else {
				callback?.(undefined);
			}
		},
	});
};

const loginWithLDAP = (
	username: string | { username: string } | { email: string } | { id: string },
	ldapPass: string,
	callback?: LoginCallback,
) => {
	Accounts.callLoginMethod({
		methodArguments: [
			{
				ldap: true,
				username,
				ldapPass,
				ldapOptions: {},
			},
		],
		userCallback: callback,
	});
};

Meteor.loginWithLDAP = (
	username: string | { username: string } | { email: string } | { id: string },
	ldapPass: string,
	callback?: LoginCallback,
) => {
	import('../../lib/2fa/overrideLoginMethod')
		.then(({ overrideLoginMethod }) => {
			overrideLoginMethod(
				loginWithLDAP,
				[username, ldapPass],
				callback,
				loginWithLDAPAndTOTP,
				typeof username === 'string' ? username : undefined,
			);
		})
		.catch(callback);
};
