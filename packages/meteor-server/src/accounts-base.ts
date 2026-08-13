import { createHash } from 'node:crypto';

import { Random } from '@rocket.chat/random';
import type { Collection, Document, Filter, FindOptions, UpdateFilter } from 'mongodb';

import { MeteorError, Meteor, _setUserLoader, currentMethodInvocation, makeErrorType } from './meteor.ts';
import { MongoInternals } from './mongo.ts';

/**
 * PARTIAL port of meteor/accounts-base (server).
 *
 * Functional: token hashing/stamping, login token insertion, login handler
 * registry, login/logout hooks, per-connection account data.
 *
 * NOT implemented (must be vendored from meteor/accounts-base and
 * meteor/accounts-password before login works end-to-end): password
 * checking/setting (bcrypt-over-SHA256 semantics), the `login`/`logout` DDP
 * methods, user creation validation pipeline, email flows. The stubs below
 * throw with a pointer here so nothing fails silently.
 *
 * COMPATIBILITY: `_hashLoginToken` must remain SHA-256 → base64, and stamped
 * tokens must remain `Random.secret()` — existing sessions in the database
 * depend on it.
 */

const usersCollection = (): Collection<Document> => MongoInternals.defaultRemoteCollectionDriver().mongo.db.collection('users');

const users = {
	async findOneAsync(selector: Filter<Document> | string, options?: FindOptions): Promise<Document | null> {
		return usersCollection().findOne(typeof selector === 'string' ? { _id: selector as any } : selector, options);
	},

	find(selector: Filter<Document> = {}, options?: FindOptions) {
		const cursor = usersCollection().find(selector, options);
		return {
			fetchAsync: () => cursor.toArray(),
			forEachAsync: (callback: (doc: Document) => void | Promise<void>) => cursor.forEach((doc) => void callback(doc)),
			countAsync: () => usersCollection().countDocuments(selector),
			[Symbol.asyncIterator]: () => cursor[Symbol.asyncIterator](),
		};
	},

	async updateAsync(selector: Filter<Document> | string, modifier: UpdateFilter<Document>): Promise<number> {
		const result = await usersCollection().updateMany(typeof selector === 'string' ? { _id: selector as any } : selector, modifier);
		return result.modifiedCount;
	},

	async insertAsync(doc: Document): Promise<string> {
		doc._id ??= Random.id();
		await usersCollection().insertOne(doc as any);
		return doc._id as string;
	},

	async removeAsync(selector: Filter<Document> | string): Promise<number> {
		const result = await usersCollection().deleteMany(typeof selector === 'string' ? { _id: selector as any } : selector);
		return result.deletedCount;
	},
};

_setUserLoader((userId) => users.findOneAsync(userId));

type LoginHandler = (this: unknown, options: Record<string, any>) => Promise<unknown> | unknown;

const loginHandlers: Array<{ name: string | undefined; handler: LoginHandler }> = [];

type HookCallback = (...args: any[]) => unknown;

const makeHookRegistry = () => {
	const callbacks = new Set<HookCallback>();
	const register = (callback: HookCallback) => {
		callbacks.add(callback);
		return {
			stop: () => callbacks.delete(callback),
		};
	};
	register.callbacks = callbacks;
	return register;
};

const onLoginHook = makeHookRegistry();
const onLogoutHook = makeHookRegistry();
const onLoginFailureHook = makeHookRegistry();
const validateLoginHook = makeHookRegistry();
const validateNewUserHooks: Array<(user: Document) => boolean | Promise<boolean>> = [];

const notImplemented = (member: string): never => {
	throw new Error(`Accounts.${member} is not implemented yet in @rocket.chat/meteor-server — vendor it from meteor/accounts-base`);
};

// Per-connection account data (Meteor keys this by DDP connection id)
const accountData: Record<string, Record<string, any>> = {};

// Services registered through meteor/accounts-oauth, which extends Accounts
const oauthServices = new Set<string>();

const autopublishFields: { forLoggedInUser: string[]; forOtherUsers: string[] } = {
	forLoggedInUser: [],
	forOtherUsers: [],
};

let onCreateUserHook: ((options: Record<string, any>, user: Document) => Document | Promise<Document>) | undefined;

const DEFAULT_LOGIN_EXPIRATION_DAYS = 90;

export const Accounts = {
	users,

	/** Port of the meteor/accounts-oauth surface bolted onto Accounts */
	oauth: {
		registerService(name: string): void {
			oauthServices.add(name);
		},

		unregisterService(name: string): void {
			oauthServices.delete(name);
		},

		serviceNames(): string[] {
			return [...oauthServices];
		},
	},

	_options: {} as Record<string, any>,

	config(options: Record<string, any>): void {
		Object.assign(Accounts._options, options);
	},

	// --- token machinery (compatible with existing sessions) ---

	_bcryptRounds(): number {
		return Accounts._options.bcryptRounds || 10;
	},

	_hashLoginToken(loginToken: string): string {
		return createHash('sha256').update(loginToken).digest('base64');
	},

	_generateStampedLoginToken(): { token: string; when: Date } {
		return { token: Random.secret(), when: new Date() };
	},

	_hashStampedToken<T extends { token: string }>(stampedToken: T): Omit<T, 'token'> & { hashedToken: string } {
		const { token, ...hashedStampedToken } = stampedToken;
		return {
			...hashedStampedToken,
			hashedToken: Accounts._hashLoginToken(token),
		};
	},

	async _insertLoginToken(userId: string, stampedToken: { token: string; when: Date }): Promise<void> {
		const hashedToken = Accounts._hashStampedToken(stampedToken);
		await users.updateAsync(userId, {
			$addToSet: {
				'services.resume.loginTokens': hashedToken,
			},
		} as UpdateFilter<Document>);
	},

	async _insertHashedLoginToken(userId: string, hashedToken: { hashedToken: string; when?: Date }): Promise<void> {
		await users.updateAsync(userId, {
			$addToSet: {
				'services.resume.loginTokens': hashedToken,
			},
		} as UpdateFilter<Document>);
	},

	// --- per-connection state ---

	_accountData: accountData,

	_getAccountData(connectionId: string, field: string): unknown {
		return accountData[connectionId]?.[field];
	},

	_setAccountData(connectionId: string, field: string, value: unknown): void {
		if (value === undefined) {
			delete accountData[connectionId]?.[field];
			return;
		}
		accountData[connectionId] ??= {};
		accountData[connectionId][field] = value;
	},

	_getLoginToken(connectionId: string): string | undefined {
		return Accounts._getAccountData(connectionId, 'loginToken') as string | undefined;
	},

	_setLoginToken(_userId: string, connection: { id: string }, newToken: string | null): void {
		Accounts._setAccountData(connection.id, 'loginToken', newToken ?? undefined);
	},

	// --- login handlers and hooks ---

	registerLoginHandler(name: string | LoginHandler, handler?: LoginHandler): void {
		if (typeof name === 'function') {
			handler = name;
			name = undefined as unknown as string;
		}
		loginHandlers.push({ name: name as string | undefined, handler: handler! });
	},

	async _runLoginHandlers(methodInvocation: unknown, options: Record<string, any>): Promise<any> {
		for (const { handler } of loginHandlers) {
			const result = await handler.call(methodInvocation, options);
			if (result !== undefined) {
				return result;
			}
		}
		throw new MeteorError(400, 'Unrecognized options for login request');
	},

	onLogin: onLoginHook,
	onLogout: onLogoutHook,
	onLoginFailure: onLoginFailureHook,
	validateLoginAttempt: validateLoginHook,

	validateNewUser(callback: (user: Document) => boolean | Promise<boolean>): void {
		validateNewUserHooks.push(callback);
	},

	_validateNewUserHooks: validateNewUserHooks,

	LoginCancelledError: (() => {
		const err = makeErrorType('Accounts.LoginCancelledError', function (this: any, description?: string) {
			this.message = description || 'Login cancelled';
		});
		// Identifier for the DDP-safe variant of this error (matches Meteor)
		err.numericError = 0x8acdc2f;
		return err;
	})(),

	// --- user creation / external services ---

	async insertUserDoc(options: Record<string, any>, user: Document): Promise<string> {
		user = { createdAt: new Date(), _id: Random.id(), services: {}, ...user };

		if (options.profile) {
			user.profile = { ...(user.profile as Record<string, unknown>), ...options.profile };
		}

		for (const validator of validateNewUserHooks) {
			if (!(await validator(user))) {
				throw new MeteorError(403, 'User validation failed');
			}
		}

		return users.insertAsync(user);
	},

	async createUserAsync(options: Record<string, any>): Promise<string> {
		if (options.password) {
			// requires the bcrypt pipeline from meteor/accounts-password
			return notImplemented('createUserAsync with a password');
		}
		const { username, email } = options;
		const user: Document = { services: {} };
		if (username) user.username = username;
		if (email) user.emails = [{ address: email, verified: false }];
		return Accounts.insertUserDoc(options, user);
	},

	async updateOrCreateUserFromExternalService(
		serviceName: string,
		serviceData: Record<string, any>,
		options?: Record<string, any>,
	): Promise<{ type: string; userId: string } | undefined> {
		// TODO(meteor-server): reconcile with meteor/accounts-base semantics
		// (case-sensitivity of service ids, `Accounts.oauth` service checks,
		// pinning of existing emails, etc.) before using in production.
		const serviceIdKey = `services.${serviceName}.id`;
		const user = await users.findOneAsync({ [serviceIdKey]: serviceData.id });

		if (user) {
			const setAttrs: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(serviceData)) {
				setAttrs[`services.${serviceName}.${key}`] = value;
			}
			await users.updateAsync(user._id as string, { $set: setAttrs });
			return { type: serviceName, userId: user._id as string };
		}

		const newUser: Document = {
			services: { [serviceName]: serviceData },
		};
		const userId = await Accounts.insertUserDoc(options ?? {}, newUser);
		return { type: serviceName, userId };
	},

	// --- login flow (port of accounts-base) ---

	/**
	 * Ambiguous by default, as in Meteor: an attacker must not learn whether the
	 * username or the password was the wrong part.
	 */
	_handleError(msg: string, throwError = true, errorCode: string | number = 403): MeteorError {
		const isErrorAmbiguous = Accounts._options.ambiguousErrorMessages ?? true;
		const error = new MeteorError(errorCode, isErrorAmbiguous ? 'Something went wrong. Please check your credentials.' : msg);

		if (throwError) {
			throw error;
		}
		return error;
	},

	_tokenExpiration(when: Date | number): Date {
		const loginExpirationInDays = Accounts._options.loginExpirationInDays ?? DEFAULT_LOGIN_EXPIRATION_DAYS;
		return new Date(new Date(when).getTime() + loginExpirationInDays * 24 * 60 * 60 * 1000);
	},

	_tokenExpiresSoon(when: Date): boolean {
		const minLifetimeMs = 0.1 * (Accounts._options.loginExpirationInDays ?? DEFAULT_LOGIN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;
		return new Date().getTime() + minLifetimeMs > Accounts._tokenExpiration(when).getTime();
	},

	async destroyToken(userId: string, loginToken: string): Promise<void> {
		await users.updateAsync(userId, {
			$pull: {
				'services.resume.loginTokens': {
					$or: [{ hashedToken: loginToken }, { token: loginToken }],
				},
			},
		} as unknown as UpdateFilter<Document>);
	},

	async _loginUser(
		methodInvocation: any,
		userId: string,
		stampedLoginToken?: { token: string; when: Date },
	): Promise<{ id: string; token: string; tokenExpires: Date }> {
		if (!stampedLoginToken) {
			stampedLoginToken = Accounts._generateStampedLoginToken();
			await Accounts._insertLoginToken(userId, stampedLoginToken);
		}

		// Set the token on the connection before the userId, so anything that
		// reacts to the userId sees a consistent view (as in Meteor).
		if (methodInvocation.connection) {
			Accounts._setLoginToken(userId, methodInvocation.connection, Accounts._hashLoginToken(stampedLoginToken.token));
		}

		await methodInvocation.setUserId(userId);

		return {
			id: userId,
			token: stampedLoginToken.token,
			tokenExpires: Accounts._tokenExpiration(stampedLoginToken.when),
		};
	},

	/**
	 * Called for *all* login attempts, successful or not, so the validate and
	 * failure hooks always run.
	 */
	async _attemptLogin(methodInvocation: any, methodName: string, methodArgs: unknown[], result: any): Promise<any> {
		if (!result) {
			throw new Error('result is required');
		}

		if (!result.userId && !result.error) {
			throw new Error('A login method must specify a userId or an error');
		}

		const user = result.userId ? await users.findOneAsync(result.userId) : undefined;

		const attempt: Record<string, any> = {
			type: result.type || 'unknown',
			allowed: !!(result.userId && !result.error),
			methodName,
			methodArguments: Array.from(methodArgs),
			...(result.error && { error: result.error }),
			...(user && { user }),
		};

		await Accounts._validateLogin(methodInvocation.connection, attempt);

		if (!attempt.allowed) {
			await Accounts._failedLogin(methodInvocation.connection, attempt);
			throw attempt.error;
		}

		const loggedIn = await Accounts._loginUser(methodInvocation, result.userId, result.stampedLoginToken);
		const ret = { ...loggedIn, ...result.options, type: attempt.type };

		await Accounts._successfulLogin(methodInvocation.connection, attempt);

		return ret;
	},

	async _validateLogin(connection: unknown, attempt: Record<string, any>): Promise<void> {
		for (const callback of validateLoginHook.callbacks) {
			let ret;
			try {
				ret = await callback({ ...attempt, connection });
			} catch (e) {
				attempt.allowed = false;
				attempt.error = e;
				continue;
			}
			if (!ret) {
				attempt.allowed = false;
				attempt.error ??= new MeteorError(403, 'Login forbidden');
			}
		}
	},

	async _successfulLogin(connection: unknown, attempt: Record<string, any>): Promise<void> {
		for (const callback of onLoginHook.callbacks) {
			await callback({ ...attempt, connection });
		}
	},

	async _failedLogin(connection: unknown, attempt: Record<string, any>): Promise<void> {
		for (const callback of onLoginFailureHook.callbacks) {
			await callback({ ...attempt, connection });
		}
	},

	async _successfulLogout(connection: unknown, userId?: string | null): Promise<void> {
		const user = userId ? await users.findOneAsync(userId) : undefined;
		for (const callback of onLogoutHook.callbacks) {
			await callback({ user, connection });
		}
	},

	// --- passwords: installed by accounts-password.ts ---

	async setPasswordAsync(_userId: string, _newPassword: string, _options?: { logout?: boolean }): Promise<void> {
		return notImplemented('setPasswordAsync (import @rocket.chat/meteor-server/accounts-password)');
	},

	async _checkPasswordAsync(_user: Document, _password: unknown): Promise<any> {
		return notImplemented('_checkPasswordAsync (import @rocket.chat/meteor-server/accounts-password)');
	},

	async _findUserByQuery(_query: Record<string, any>, _options?: unknown): Promise<Document | null> {
		return notImplemented('_findUserByQuery (import @rocket.chat/meteor-server/accounts-password)');
	},

	async findUserByUsername(_username: string, _options?: unknown): Promise<Document | null> {
		return notImplemented('findUserByUsername (import @rocket.chat/meteor-server/accounts-password)');
	},

	async findUserByEmail(_email: string, _options?: unknown): Promise<Document | null> {
		return notImplemented('findUserByEmail (import @rocket.chat/meteor-server/accounts-password)');
	},

	async sendVerificationEmail(_userId: string, _address?: string): Promise<never> {
		return notImplemented('sendVerificationEmail');
	},

	async sendResetPasswordEmail(_userId: string, _address?: string): Promise<never> {
		return notImplemented('sendResetPasswordEmail');
	},

	emailTemplates: {
		from: 'Accounts <no-reply@example.com>',
		siteName: 'Rocket.Chat',
		verifyEmail: {} as Record<string, unknown>,
		resetPassword: {} as Record<string, unknown>,
		enrollAccount: {} as Record<string, unknown>,
	},

	// --- autopublish / publish field registries ---

	/**
	 * Meteor's autopublish integration. There is no autopublish here, but the
	 * registered fields are kept so callers can inspect them.
	 */
	addAutopublishFields(opts: { forLoggedInUser?: string[]; forOtherUsers?: string[] }): void {
		autopublishFields.forLoggedInUser.push(...(opts?.forLoggedInUser ?? []));
		autopublishFields.forOtherUsers.push(...(opts?.forOtherUsers ?? []));
	},

	_autopublishFields: autopublishFields,

	/** Projection applied to the published user document; app code mutates it */
	_defaultPublishFields: {
		projection: {
			username: 1,
			emails: 1,
			profile: 1,
		} as Record<string, number>,
	},

	// --- token lifecycle ---

	async _clearAllLoginTokens(userId: string): Promise<void> {
		await users.updateAsync(userId, {
			$set: { 'services.resume.loginTokens': [] },
		} as UpdateFilter<Document>);
	},

	/** Replaced wholesale by server/lib/auth/startup.js, kept for shape */
	async _expireTokens(oldestValidDate: Date, userId?: string): Promise<void> {
		await usersCollection().updateMany(userId ? ({ _id: userId } as unknown as Filter<Document>) : {}, {
			$pull: {
				'services.resume.loginTokens': { when: { $lt: oldestValidDate } },
			},
		} as unknown as UpdateFilter<Document>);
	},

	// --- user creation hook ---

	onCreateUser(callback: (options: Record<string, any>, user: Document) => Document | Promise<Document>): void {
		onCreateUserHook = callback;
	},

	_onCreateUserHook: () => onCreateUserHook,

	// --- misc ---

	/** URL builders; app code overrides these (e.g. Accounts.urls.resetPassword) */
	urls: {
		resetPassword: (token: string) => Meteor.absoluteUrl(`reset-password/${token}`),
		verifyEmail: (token: string) => Meteor.absoluteUrl(`verify-email/${token}`),
		enrollAccount: (token: string) => Meteor.absoluteUrl(`enroll-account/${token}`),
	},

	ConfigError: makeErrorType('Accounts.ConfigError', function (this: any, description?: string) {
		this.message = description || 'Service not configured';
	}),

	async sendEnrollmentEmail(_userId: string, _address?: string): Promise<never> {
		return notImplemented('sendEnrollmentEmail');
	},

	// --- helpers Rocket.Chat reaches for ---

	_getLoginTokenFromInvocation(): string | undefined {
		const invocation = currentMethodInvocation.get();
		const connectionId = (invocation as any)?.connection?.id;
		return connectionId ? Accounts._getLoginToken(connectionId) : undefined;
	},
};

// Meteor.users points at the same collection surface
(Meteor as any).users = users;

/**
 * The login/logout DDP methods (port of Accounts._initServerMethods).
 * Rocket.Chat's REST login endpoint calls `Meteor.callAsync('login', ...)`,
 * so these have to exist as ordinary methods.
 */
Meteor.methods({
	async login(this: any, options: Record<string, any>) {
		// Login handlers should really also check whatever field they look at in
		// options, but Meteor does not enforce it either.
		const result = await Accounts._runLoginHandlers(this, options);

		return Accounts._attemptLogin(this, 'login', [options], result);
	},

	async logout(this: any) {
		const token = this.connection && Accounts._getLoginToken(this.connection.id);
		if (this.connection) {
			Accounts._setLoginToken(this.userId, this.connection, null);
		}
		if (token && this.userId) {
			await Accounts.destroyToken(this.userId, token);
		}
		await Accounts._successfulLogout(this.connection, this.userId);
		await this.setUserId(null);
	},

	async logoutAllClients(this: any) {
		const logoutUserId = this.userId;
		if (this.connection) {
			Accounts._setLoginToken(logoutUserId, this.connection, null);
		}
		if (logoutUserId) {
			await Accounts._clearAllLoginTokens(logoutUserId);
		}
		await Accounts._successfulLogout(this.connection, logoutUserId);
		await this.setUserId(null);
	},
});
