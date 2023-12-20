import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import type { LoginCallback } from '../../lib/2fa/overrideLoginMethod';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithCrowd(
			userDescriptor: { username: string } | { email: string } | { id: string } | string,
			password: string,
			callback?: LoginCallback,
		): void;
	}
}

const createLoginRequest = (userDescriptor: { username: string } | { email: string } | { id: string } | string, password: string) => ({
	crowd: true,
	username: userDescriptor,
	crowdPassword: password,
});

const loginWithCrowdAndTOTP = (
	userDescriptor: { username: string } | { email: string } | { id: string } | string,
	password: string,
	code: string,
	callback?: LoginCallback,
) => {
	const loginRequest = createLoginRequest(userDescriptor, password);

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
				if (callback) {
					callback(error);
					return;
				}

				throw error;
			} else {
				callback?.(undefined);
			}
		},
	});
};

const loginWithCrowd = (
	userDescriptor: { username: string } | { email: string } | { id: string } | string,
	password: string,
	callback?: LoginCallback,
) => {
	const loginRequest = createLoginRequest(userDescriptor, password);

	Accounts.callLoginMethod({
		methodArguments: [loginRequest],
		userCallback(error) {
			if (error) {
				if (callback) {
					callback(error);
					return;
				}

				throw error;
			} else {
				callback?.(undefined);
			}
		},
	});
};

Meteor.loginWithCrowd = (userDescriptor, password, callback) => {
	import('../../lib/2fa/overrideLoginMethod')
		.then(({ overrideLoginMethod }) => {
			overrideLoginMethod(loginWithCrowd, [userDescriptor, password], callback, loginWithCrowdAndTOTP);
		})
		.catch(callback);
};
