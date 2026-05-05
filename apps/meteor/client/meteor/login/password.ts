import { SHA256 } from '@rocket.chat/sha256';
import { Meteor } from 'meteor/meteor';

import { overrideLoginMethod, type LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { getDdpSdk } from '../../lib/sdk/ddpSdk';

const hashPassword = (password: string) => ({ digest: SHA256(password), algorithm: 'sha-256' as const });

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

export const loginWithPasswordAndTOTP = (
	userDescriptor: { username: string } | { email: string } | { id: string } | string,
	password: string,
	code: string,
	callback?: LoginCallback,
): Promise<void> => {
	if (typeof userDescriptor === 'string') {
		if (userDescriptor.indexOf('@') === -1) {
			userDescriptor = { username: userDescriptor };
		} else {
			userDescriptor = { email: userDescriptor };
		}
	}

	return new Promise<void>((resolve, reject) => {
		getDdpSdk().account.callLoginMethod({
			methodArguments: [
				{
					totp: {
						login: {
							user: userDescriptor,
							password: hashPassword(password),
						},
						code,
					},
				},
			],
			userCallback(error) {
				if (!error) {
					callback?.(undefined);
					resolve();
					return;
				}

				callback?.(error);
				reject(error);
			},
		});
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
