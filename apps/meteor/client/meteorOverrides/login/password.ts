import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { overrideLoginMethod, type LoginCallback } from '../../lib/2fa/overrideLoginMethod';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithPassword(
			userDescriptor: { username: string } | { email: string } | { id: string } | string,
			password: string,
			callback?: LoginCallback,
		): void;
	}
}

const loginWithPasswordAndTOTP = (
	userDescriptor: { username: string } | { email: string } | { id: string } | string,
	password: string,
	code: string,
	callback?: LoginCallback,
) => {
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
			if (!error) {
				callback?.(undefined);
				return;
			}

			if (callback) {
				callback(error);
				return;
			}

			throw error;
		},
	});
};

const { loginWithPassword } = Meteor;

Meteor.loginWithPassword = (
	userDescriptor: { username: string } | { email: string } | { id: string } | string,
	password: string,
	callback?: LoginCallback,
) => {
	overrideLoginMethod(loginWithPassword, [userDescriptor, password], callback, loginWithPasswordAndTOTP);
};
