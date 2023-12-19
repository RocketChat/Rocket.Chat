import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { with2FA, type LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { reportError } from '../../lib/2fa/utils';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithPasswordAndTOTP(
			userDescriptor: { username: string } | { email: string } | { id: string } | string,
			password: string,
			code: string,
			callback?: LoginCallback,
		): void;

		function loginWithPassword(
			userDescriptor: { username: string } | { email: string } | { id: string } | string,
			password: string,
			callback?: LoginCallback,
		): void;
	}
}

Meteor.loginWithPasswordAndTOTP = function (userDescriptor, password, code, callback) {
	if (typeof userDescriptor === 'string') {
		if (userDescriptor.indexOf('@') === -1) {
			userDescriptor = { username: userDescriptor };
		} else {
			userDescriptor = { email: userDescriptor };
		}
	}

	Accounts.callLoginMethod({
		methodArguments: [
			{
				totp: {
					login: {
						user: userDescriptor,
						password: Accounts._hashPassword(password),
					},
					code,
				},
			},
		],
		userCallback(error) {
			if (error) {
				reportError(error, callback);
			} else {
				callback?.(undefined);
			}
		},
	});
};

Meteor.loginWithPassword = with2FA(Meteor.loginWithPassword, Meteor.loginWithPasswordAndTOTP);
