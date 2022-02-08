import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

(Meteor as any).loginWithLDAP = function (username: string, password: string, callback?: (err?: any) => void): void {
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
