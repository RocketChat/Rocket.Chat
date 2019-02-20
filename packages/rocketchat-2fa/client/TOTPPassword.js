import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Utils2fa } from './lib/2fa';

Meteor.loginWithPasswordAndTOTP = function(selector, password, code, callback) {
	if (typeof selector === 'string') {
		if (selector.indexOf('@') === -1) {
			selector = { username: selector };
		} else {
			selector = { email: selector };
		}
	}

	Accounts.callLoginMethod({
		methodArguments: [{
			totp: {
				login: {
					user: selector,
					password: Accounts._hashPassword(password),
				},
				code,
			},
		}],
		userCallback(error) {
			if (error) {
				Utils2fa.reportError(error, callback);
			} else {
				callback && callback();
			}
		},
	});
};

const { loginWithPassword } = Meteor;

Meteor.loginWithPassword = function(email, password, cb) {
	Utils2fa.overrideLoginMethod(loginWithPassword, [email, password], cb, Meteor.loginWithPasswordAndTOTP);
};
