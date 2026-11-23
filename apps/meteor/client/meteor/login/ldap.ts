import { handleLogin, type LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { callLoginMethod, registerLoginWithMethod } from '../accounts';

type LdapUser = string | { username: string } | { email: string } | { id: string };

declare module 'meteor/meteor' {
	// oxlint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithLDAP(username: LdapUser, ldapPass: string, callback?: LoginCallback): void;
	}
}

const loginWithLDAP = (username: LdapUser, ldapPass: string) =>
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

const loginWithLDAPAndTOTP = (username: LdapUser, ldapPass: string, code: string) => {
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

const runLdapLogin = handleLogin(loginWithLDAP, loginWithLDAPAndTOTP);

registerLoginWithMethod('loginWithLDAP', (username: LdapUser, ldapPass: string, callback?: LoginCallback) =>
	runLdapLogin([username, ldapPass], callback),
);
