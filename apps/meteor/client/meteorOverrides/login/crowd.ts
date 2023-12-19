import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import type { LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { with2FA } from '../../lib/2fa/overrideLoginMethod';
import { reportError } from '../../lib/2fa/utils';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithCrowdAndTOTP(
			userDescriptor: { username: string } | { email: string } | { id: string } | string,
			password: string,
			code: string,
			callback?: LoginCallback,
		): void;

		function loginWithCrowd(
			userDescriptor: { username: string } | { email: string } | { id: string } | string,
			password: string,
			callback?: LoginCallback,
		): void;
	}
}

Meteor.loginWithCrowdAndTOTP = function (userDescriptor, password, code, callback) {
	const loginRequest = {
		crowd: true,
		username: userDescriptor,
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
		userCallback: (error) => {
			if (error) {
				reportError(error, callback);
				return;
			}
			callback?.(undefined);
		},
	});
};

Meteor.loginWithCrowd = with2FA(function loginWithCrowd(userDescriptor, password, callback) {
	const loginRequest = {
		crowd: true,
		username: userDescriptor,
		crowdPassword: password,
	};

	Accounts.callLoginMethod({
		methodArguments: [loginRequest],
		userCallback: (error) => callback?.(error || null),
	});
}, Meteor.loginWithCrowdAndTOTP);
