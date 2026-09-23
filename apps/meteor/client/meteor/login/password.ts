import { SHA256 } from '@rocket.chat/sha256';

import { overrideLoginMethod, type LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import type { MeteorErrorLike } from '../../lib/2fa/types';
import { callLoginMethod, registerLoginWithMethod } from '../accounts';

type UserDescriptor = { username: string } | { email: string } | { id: string } | string;

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithPassword(userDescriptor: UserDescriptor, password: string, callback?: LoginCallback): void;
	}
}

const toUserSelector = (userDescriptor: UserDescriptor) => {
	if (typeof userDescriptor !== 'string') {
		return userDescriptor;
	}

	return userDescriptor.includes('@') ? { email: userDescriptor } : { username: userDescriptor };
};

const hashPassword = (password: string) => ({ digest: SHA256(password), algorithm: 'sha-256' });

const loginWithPassword = (userDescriptor: UserDescriptor, password: string, callback: LoginCallback) => {
	callLoginMethod({ methodArguments: [{ user: toUserSelector(userDescriptor), password: hashPassword(password) }] }).then(
		() => callback(undefined),
		(error: MeteorErrorLike) => callback(error),
	);
};

export const loginWithPasswordAndTOTP = (
	userDescriptor: UserDescriptor,
	password: string,
	code: string,
	callback?: LoginCallback,
): Promise<void> =>
	callLoginMethod({
		methodArguments: [{ totp: { login: { user: toUserSelector(userDescriptor), password: hashPassword(password) }, code } }],
	}).then(
		() => callback?.(undefined),
		(error) => {
			callback?.(error);
			throw error;
		},
	);

registerLoginWithMethod('loginWithPassword', (userDescriptor: UserDescriptor, password: string, callback?: LoginCallback) => {
	overrideLoginMethod(loginWithPassword, [userDescriptor, password], callback, loginWithPasswordAndTOTP);
});
