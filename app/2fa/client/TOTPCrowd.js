import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { Utils2fa } from './lib/2fa';
import '../../crowd/client/index';

Meteor.loginWithCrowdAndTOTP = function(username, password, code, callback) {
	console.log('login with CROWD and TOTP');
	const loginRequest = {
		crowd: true,
		username,
		crowdPassword: password,
	};

	Accounts.callLoginMethod({
		methodArguments: [{
			totp: {
				login: loginRequest,
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

const { loginWithCrowd } = Meteor;

Meteor.loginWithCrowd = function(username, password, callback) {
	console.log('login with crowd - override');
	Utils2fa.overrideLoginMethod(loginWithCrowd, [username, password], callback, Meteor.loginWithCrowdAndTOTP);
};
