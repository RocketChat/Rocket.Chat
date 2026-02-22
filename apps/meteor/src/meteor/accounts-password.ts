import { Accounts } from './accounts-base.ts';
import { MeteorError } from './meteor.ts';
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

type InternalLoginOptions = {
	selector: UserSelector;
	password: string;
	code?: string | undefined; // 2FA code
	callback?: MeteorCallback | undefined;
};

type CreateUserOptions = {
	username?: string;
	email?: string;
	password: string | PasswordDigest;
	profile?: Record<string, any>;
	[key: string]: any;
};

type ForgotPasswordOptions = {
	email: string;
};

const reportError = (error: Error, callback?: MeteorCallback): void => {
	if (callback) {
		callback(error);
	} else {
		throw error;
	}
};

const internalLoginWithPassword = ({ selector, password, code, callback }: InternalLoginOptions): UserSelector => {
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
				code,
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

export const _hashPassword = (password: string): PasswordDigest => ({
	digest: SHA256(password),
	algorithm: 'sha-256',
});

export const loginWithPassword = (selector: UserSelector, password: string, callback?: MeteorCallback): UserSelector => {
	return internalLoginWithPassword({ selector, password, callback });
};

export const loginWithPasswordAsync = (selector: UserSelector, password: string): Promise<any> => {
	return new Promise((resolve, reject) => {
		internalLoginWithPassword({
			selector,
			password,
			callback: (err, res) => (err ? reject(err) : resolve(res)),
		});
	});
};

export const loginWithPasswordAnd2faCode = (
	selector: UserSelector,
	password: string,
	code: string,
	callback?: MeteorCallback,
): UserSelector => {
	if (!code || typeof code !== 'string') {
		throw new MeteorError(400, 'Token is required to use loginWithPasswordAnd2faCode and must be a string');
	}
	return internalLoginWithPassword({ selector, password, code, callback });
};

export const loginWithPasswordAnd2faCodeAsync = (selector: UserSelector, password: string, code: string): Promise<any> => {
	return new Promise((resolve, reject) => {
		loginWithPasswordAnd2faCode(selector, password, code, (err, res) => (err ? reject(err) : resolve(res)));
	});
};

export const createUser = (options: CreateUserOptions, callback?: MeteorCallback): void => {
	const safeOptions = { ...options };

	if (typeof safeOptions.password !== 'string') {
		throw new Error('options.password must be a string');
	}

	if (!safeOptions.password) {
		return reportError(new MeteorError(400, 'Password may not be empty'), callback);
	}
	safeOptions.password = _hashPassword(safeOptions.password);

	Accounts.callLoginMethod({
		methodName: 'createUser',
		methodArguments: [safeOptions],
		userCallback: callback,
	});
};

export const createUserAsync = (options: CreateUserOptions): Promise<any> => {
	return new Promise((resolve, reject) =>
		createUser(options, (error, result) => {
			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		}),
	);
};

export const changePassword = (oldPassword: string | null, newPassword: string, callback?: MeteorCallback): void => {
	if (!Accounts.user()) {
		return reportError(new Error('Must be logged in to change password.'), callback);
	}

	if (typeof newPassword !== 'string' || !newPassword) {
		return reportError(new MeteorError(400, 'Password must be a non-empty string'), callback);
	}

	Accounts.connection.apply(
		'changePassword',
		[oldPassword ? _hashPassword(oldPassword) : null, _hashPassword(newPassword)],
		undefined,
		(error, result) => {
			if (error || !result) {
				reportError(error || new Error('No result from changePassword.'), callback);
			} else if (callback) {
				callback();
			}
		},
	);
};

export const changePasswordAsync = (oldPassword: string | null, newPassword: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		changePassword(oldPassword, newPassword, (err) => (err ? reject(err) : resolve()));
	});
};

export const forgotPassword = (options: ForgotPasswordOptions, callback: MeteorCallback): void => {
	if (!options.email) {
		return reportError(new MeteorError(400, 'Must pass options.email'), callback);
	}

	Accounts.connection.call('forgotPassword', options, callback);
};

export const forgotPasswordAsync = (options: ForgotPasswordOptions): Promise<any> => {
	return new Promise((resolve, reject) => {
		forgotPassword(options, (err, res) => (err ? reject(err) : resolve(res)));
	});
};

export const resetPassword = (token: string, newPassword: string, callback?: MeteorCallback): void => {
	if (typeof token !== 'string') {
		return reportError(new MeteorError(400, 'Token must be a string'), callback);
	}

	if (typeof newPassword !== 'string' || !newPassword) {
		return reportError(new MeteorError(400, 'Password must be a non-empty string'), callback);
	}

	Accounts.callLoginMethod({
		methodName: 'resetPassword',
		methodArguments: [token, _hashPassword(newPassword)],
		userCallback: callback,
	});
};

export const resetPasswordAsync = (token: string, newPassword: string): Promise<any> => {
	return new Promise((resolve, reject) => {
		resetPassword(token, newPassword, (err, res) => (err ? reject(err) : resolve(res)));
	});
};

export const verifyEmail = (token: string, callback?: MeteorCallback): void => {
	if (!token) {
		return reportError(new MeteorError(400, 'Need to pass token'), callback);
	}

	Accounts.callLoginMethod({
		methodName: 'verifyEmail',
		methodArguments: [token],
		userCallback: callback,
	});
};

export const verifyEmailAsync = (token: string): Promise<any> => {
	return new Promise((resolve, reject) => {
		verifyEmail(token, (err, res) => (err ? reject(err) : resolve(res)));
	});
};
