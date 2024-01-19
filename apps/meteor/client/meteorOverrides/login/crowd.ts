import { Meteor } from 'meteor/meteor';

import { callLoginMethod, handleLogin, type LoginCallback } from '../../lib/2fa/overrideLoginMethod';

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

const loginWithCrowd = (userDescriptor: { username: string } | { email: string } | { id: string } | string, password: string) => {
	const loginRequest = {
		crowd: true,
		username: userDescriptor,
		crowdPassword: password,
	};

	return callLoginMethod({ methodArguments: [loginRequest] });
};

const loginWithCrowdAndTOTP = (
	userDescriptor: { username: string } | { email: string } | { id: string } | string,
	password: string,
	code: string,
) => {
	const loginRequest = {
		crowd: true,
		username: userDescriptor,
		crowdPassword: password,
	};

	return callLoginMethod({
		methodArguments: [
			{
				totp: {
					login: loginRequest,
					code,
				},
			},
		],
	});
};

Meteor.loginWithCrowd = handleLogin(loginWithCrowd, loginWithCrowdAndTOTP);
