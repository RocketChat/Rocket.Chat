import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import '../../crowd/client/index';
import { reportError } from '../../../client/lib/2fa/utils';
import { overrideLoginMethod } from '../../../client/lib/2fa/overrideLoginMethod';

Meteor.loginWithCrowdAndTOTP = function (username, password, code, callback) {
	const loginRequest = {
		crowd: true,
		username,
		crowdPassword: password,
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
				callback && callback();
			}
		},
	});
};

const { loginWithCrowd } = Meteor;

Meteor.loginWithCrowd = function (username, password, callback) {
	overrideLoginMethod(loginWithCrowd, [username, password], callback, Meteor.loginWithCrowdAndTOTP);
};
