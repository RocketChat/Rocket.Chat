// Pass in username, password as normal
// customLdapOptions should be passed in if you want to override LDAP_DEFAULTS
// on any particular call (if you have multiple ldap servers you'd like to connect to)
// You'll likely want to set the dn value here {dn: "..."}
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import toastr from 'toastr';

import { t } from '../../utils';
import { process2faReturn } from '../../2fa/client/callWithTwoFactorRequired';

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

	const ldapCallback = (error) => {
		if (!callback) {
			return;
		}

		if (error) {
			callback(error);
			return;
		}

		callback();
	};

	Accounts.callLoginMethod({
		// Call login method with ldap = true
		// This will hook into our login handler for ldap
		methodArguments: [loginRequest],
		userCallback(error, result) {
			process2faReturn({
				error,
				result,
				originalCallback: ldapCallback,
				emailOrUsername: username,
				onCode: (code) => {
					// If LDAP resulted in a totp-required error, it means this is a login fallback, so for this second login we go straigth to password login
					Meteor.loginWithPasswordAndTOTP(username, password, code, (error) => {
						if (error && error.error === 'totp-invalid') {
							toastr.error(t('Invalid_two_factor_code'));
							ldapCallback();
						} else {
							ldapCallback(error);
						}
					});
				},
			});
		},
	});
};
