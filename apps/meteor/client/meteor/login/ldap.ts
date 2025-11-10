import { Meteor } from 'meteor/meteor';

import { callLoginMethod, handleLogin, type LoginCallback } from '../../lib/2fa/overrideLoginMethod';

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

const loginWithLDAP = (username: string | { username: string } | { email: string } | { id: string }, ldapPass: string) =>
	callLoginMethod({
		methodArguments: [
			{
				ldap: true,
				username,
				ldapPass,
				ldapOptions: {},
			},
		],
	});

const loginWithLDAPAndTOTP = (
	username: string | { username: string } | { email: string } | { id: string },
	ldapPass: string,
	code: string,
) => {
	const loginRequest = {
		ldap: true,
		username,
		ldapPass,
		ldapOptions: {},
	};

	return callLoginMethod({
		methodArguments: [
			{
				totp: {
					login: loginRequest,
					code,
				},
			},
		],
	});
};

Meteor.loginWithLDAP = handleLogin(loginWithLDAP, loginWithLDAPAndTOTP);
