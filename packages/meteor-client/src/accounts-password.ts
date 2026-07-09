import { Accounts } from './accounts-base.ts';
import { SHA256 } from './sha.ts';

type MeteorCallback<T = any> = (error?: Error, result?: T) => void;

type UserSelectorObject = {
	username?: string;
	email?: string;
	id?: string;
};

type UserSelector = string | UserSelectorObject;

type PasswordDigest = {
	digest: string;
	algorithm: string;
};

const reportError = (error: Error, callback?: MeteorCallback): void => {
	if (callback) {
		callback(error);
	} else {
		throw error;
	}
};

export const _hashPassword = (password: string): PasswordDigest => ({
	digest: SHA256(password),
	algorithm: 'sha-256',
});

export const loginWithPassword = (selector: UserSelector, password: string, callback?: MeteorCallback): UserSelector => {
	let normalizedSelector: UserSelectorObject;

	if (typeof selector === 'string') {
		if (!selector.includes('@')) {
			normalizedSelector = { username: selector };
		} else {
			normalizedSelector = { email: selector };
		}
	} else {
		normalizedSelector = selector;
	}

	Accounts.callLoginMethod({
		methodArguments: [
			{
				user: normalizedSelector,
				password: _hashPassword(password),
			},
		],
		userCallback: (error: Error | undefined, result?: any) => {
			if (error) {
				reportError(error, callback);
			} else if (callback) {
				callback(undefined, result);
			}
		},
	});

	return selector;
};
