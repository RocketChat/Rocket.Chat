import { Accounts } from './accounts-base.ts';
import { Meteor } from './meteor.ts';
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
	code?: string; // 2FA code
	callback?: MeteorCallback;
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

// --- Helpers ---

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
				password: Accounts._hashPassword(password),
				code,
			},
		],
		userCallback: (error, result) => {
			if (error) {
				reportError(error, callback);
			} else if (callback) {
				callback(undefined, result);
			}
		},
	});

	return selector;
};

// --- Hashing ---

Accounts._hashPassword = (password: string): PasswordDigest => ({
	digest: SHA256(password),
	algorithm: 'sha-256',
});

// --- Login Functions ---

/**
 * @summary Log the user in with a password.
 * @locus Client
 */
Meteor.loginWithPassword = (selector: UserSelector, password: string, callback?: MeteorCallback): UserSelector => {
	return internalLoginWithPassword({ selector, password, callback });
};

/**
 * @summary Log the user in with a password (Async).
 * @locus Client
 */
Meteor.loginWithPasswordAsync = (selector: UserSelector, password: string): Promise<any> => {
	return new Promise((resolve, reject) => {
		internalLoginWithPassword({
			selector,
			password,
			callback: (err, res) => (err ? reject(err) : resolve(res)),
		});
	});
};

/**
 * @summary Log the user in with a password and 2FA token.
 * @locus Client
 */
Meteor.loginWithPasswordAnd2faCode = (selector: UserSelector, password: string, code: string, callback?: MeteorCallback): UserSelector => {
	if (!code || typeof code !== 'string') {
		throw new Meteor.Error(400, 'Token is required to use loginWithPasswordAnd2faCode and must be a string');
	}
	return internalLoginWithPassword({ selector, password, code, callback });
};

/**
 * @summary Log the user in with a password and 2FA token (Async).
 * @locus Client
 */
Meteor.loginWithPasswordAnd2faCodeAsync = (selector: UserSelector, password: string, code: string): Promise<any> => {
	return new Promise((resolve, reject) => {
		Meteor.loginWithPasswordAnd2faCode(selector, password, code, (err, res) => (err ? reject(err) : resolve(res)));
	});
};

// --- User Creation ---

/**
 * @summary Create a new user.
 * @locus Anywhere
 */
Accounts.createUser = (options: CreateUserOptions, callback?: MeteorCallback): void => {
	// Create a shallow copy to avoid mutating the passed object
	const safeOptions = { ...options };

	if (typeof safeOptions.password !== 'string') {
		throw new Error('options.password must be a string');
	}

	if (!safeOptions.password) {
		return reportError(new Meteor.Error(400, 'Password may not be empty'), callback);
	}

	// Replace password with the hashed password.
	safeOptions.password = Accounts._hashPassword(safeOptions.password);

	Accounts.callLoginMethod({
		methodName: 'createUser',
		methodArguments: [safeOptions],
		userCallback: callback,
	});
};

/**
 * @summary Create a new user and return a promise.
 * @locus Anywhere
 */
Accounts.createUserAsync = (options: CreateUserOptions): Promise<any> => {
	return new Promise((resolve, reject) =>
		Accounts.createUser(options, (error, result) => {
			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		}),
	);
};

// --- Password Management ---

/**
 * @summary Change the current user's password. Must be logged in.
 * @locus Client
 */
Accounts.changePassword = (oldPassword: string | null, newPassword: string, callback?: MeteorCallback): void => {
	if (!Meteor.user()) {
		return reportError(new Error('Must be logged in to change password.'), callback);
	}

	if (typeof newPassword !== 'string' || !newPassword) {
		return reportError(new Meteor.Error(400, 'Password must be a non-empty string'), callback);
	}

	Accounts.connection.apply(
		'changePassword',
		[oldPassword ? Accounts._hashPassword(oldPassword) : null, Accounts._hashPassword(newPassword)],
		(error: Error, result: any) => {
			if (error || !result) {
				reportError(error || new Error('No result from changePassword.'), callback);
			} else if (callback) {
				callback();
			}
		},
	);
};

/**
 * @summary Change the current user's password (Async).
 * @locus Client
 */
Accounts.changePasswordAsync = (oldPassword: string | null, newPassword: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		Accounts.changePassword(oldPassword, newPassword, (err) => (err ? reject(err) : resolve()));
	});
};

/**
 * @summary Request a forgot password email.
 * @locus Client
 */
Accounts.forgotPassword = (options: ForgotPasswordOptions, callback?: MeteorCallback): void => {
	if (!options.email) {
		return reportError(new Meteor.Error(400, 'Must pass options.email'), callback);
	}

	const args = [options];
	if (callback) args.push(callback);

	Accounts.connection.call('forgotPassword', ...args);
};

/**
 * @summary Request a forgot password email (Async).
 * @locus Client
 */
Accounts.forgotPasswordAsync = (options: ForgotPasswordOptions): Promise<any> => {
	return new Promise((resolve, reject) => {
		Accounts.forgotPassword(options, (err, res) => (err ? reject(err) : resolve(res)));
	});
};

/**
 * @summary Reset the password for a user using a token received in email.
 * @locus Client
 */
Accounts.resetPassword = (token: string, newPassword: string, callback?: MeteorCallback): void => {
	if (typeof token !== 'string') {
		return reportError(new Meteor.Error(400, 'Token must be a string'), callback);
	}

	if (typeof newPassword !== 'string' || !newPassword) {
		return reportError(new Meteor.Error(400, 'Password must be a non-empty string'), callback);
	}

	Accounts.callLoginMethod({
		methodName: 'resetPassword',
		methodArguments: [token, Accounts._hashPassword(newPassword)],
		userCallback: callback,
	});
};

/**
 * @summary Reset the password for a user using a token received in email (Async).
 * @locus Client
 */
Accounts.resetPasswordAsync = (token: string, newPassword: string): Promise<any> => {
	return new Promise((resolve, reject) => {
		Accounts.resetPassword(token, newPassword, (err, res) => (err ? reject(err) : resolve(res)));
	});
};

/**
 * @summary Marks the user's email address as verified.
 * @locus Client
 */
Accounts.verifyEmail = (token: string, callback?: MeteorCallback): void => {
	if (!token) {
		return reportError(new Meteor.Error(400, 'Need to pass token'), callback);
	}

	Accounts.callLoginMethod({
		methodName: 'verifyEmail',
		methodArguments: [token],
		userCallback: callback,
	});
};

/**
 * @summary Marks the user's email address as verified (Async).
 * @locus Client
 */
Accounts.verifyEmailAsync = (token: string): Promise<any> => {
	return new Promise((resolve, reject) => {
		Accounts.verifyEmail(token, (err, res) => (err ? reject(err) : resolve(res)));
	});
};
