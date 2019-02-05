// Pass in username, password as normal
// customLdapOptions should be passed in if you want to override LDAP_DEFAULTS
// on any particular call (if you have multiple ldap servers you'd like to connect to)
// You'll likely want to set the dn value here {dn: "..."}
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

Meteor.loginWithLDAP = function(...args) {
	// Pull username and password
	const username = args.shift();
	const password = args.shift();

	// Check if last argument is a function
	// if it is, pop it off and set callback to it
	const callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;

	// if args still holds options item, grab it
	const customLdapOptions = args.length > 0 ? args.shift() : {};

	// Set up loginRequest object
	const loginRequest = {
		ldap: true,
		username,
		ldapPass: password,
		ldapOptions: customLdapOptions,
	};

	Accounts.callLoginMethod({
		// Call login method with ldap = true
		// This will hook into our login handler for ldap
		methodArguments: [loginRequest],
		userCallback(error/* , result*/) {
			if (error) {
				if (callback) {
					callback(error);
				}
			} else if (callback) {
				callback();
			}
		},
	});
};
