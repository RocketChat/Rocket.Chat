import { Hook } from './callback-hook.ts';
import { DDP, type Connection } from './ddp-client.ts';
import { Meteor } from './meteor.ts';
import { Mongo } from './mongo.ts';
import { Package } from './package-registry.ts';
import { Random } from './random.ts';
import { ReactiveVar } from './reactive-var.ts';
import { Tracker } from './tracker/index.ts';
import { hasOwn } from './utils/hasOwn.ts';

// config option keys
const VALID_CONFIG_KEYS = [
	'sendVerificationEmail',
	'forbidClientAccountCreation',
	'restrictCreationByEmailDomain',
	'loginExpiration',
	'loginExpirationInDays',
	'oauthSecretKey',
	'passwordResetTokenExpirationInDays',
	'passwordResetTokenExpiration',
	'passwordEnrollTokenExpirationInDays',
	'passwordEnrollTokenExpiration',
	'ambiguousErrorMessages',
	'bcryptRounds',
	'argon2Enabled',
	'argon2Type',
	'argon2TimeCost',
	'argon2MemoryCost',
	'argon2Parallelism',
	'defaultFieldSelector',
	'collection',
	'loginTokenExpirationHours',
	'tokenSequenceLength',
	'clientStorage',
	'ddpUrl',
	'connection',
];

/**
 * @summary Super-constructor for AccountsClient and AccountsServer.
 * @locus Anywhere
 * @class AccountsCommon
 * @instancename accountsClientOrServer
 * @param options {Object} an object with fields:
 * - connection {Object} Optional DDP connection to reuse.
 * - ddpUrl {String} Optional URL for creating a new DDP connection.
 * - collection {String|Mongo.Collection} The name of the Mongo.Collection
 *     or the Mongo.Collection object to hold the users.
 */
export abstract class AccountsCommon {
	public _options: any;

	public connection: Connection;

	public users: any;

	public _onLoginHook: Hook;

	public _onLoginFailureHook: Hook;

	public _onLogoutHook: Hook;

	public DEFAULT_LOGIN_EXPIRATION_DAYS: number;

	public LOGIN_UNEXPIRING_TOKEN_DAYS: number;

	public LoginCancelledError: any;

	constructor(options: { connection?: Connection; ddpUrl?: string; collection?: string }) {
		// Validate config options keys
		for (const key of Object.keys(options)) {
			if (!VALID_CONFIG_KEYS.includes(key)) {
				console.error(`Accounts.config: Invalid key: ${key}`);
			}
		}

		// Currently this is read directly by packages like accounts-password
		// and accounts-ui-unstyled.
		this._options = options || {};

		// Note that setting this.connection = null causes this.users to be a
		// LocalCollection, which is not what we want.
		this.connection = this._initConnection(options || {});

		// There is an allow call in accounts_server.js that restricts writes to
		// this collection.
		this.users = this._initializeCollection(options || {});

		// Callback exceptions are printed with Meteor._debug and ignored.
		this._onLoginHook = new Hook({
			bindEnvironment: false,
			debugPrintExceptions: 'onLogin callback',
		});

		this._onLoginFailureHook = new Hook({
			bindEnvironment: false,
			debugPrintExceptions: 'onLoginFailure callback',
		});

		this._onLogoutHook = new Hook({
			bindEnvironment: false,
			debugPrintExceptions: 'onLogout callback',
		});

		// Expose for testing.
		this.DEFAULT_LOGIN_EXPIRATION_DAYS = DEFAULT_LOGIN_EXPIRATION_DAYS;
		this.LOGIN_UNEXPIRING_TOKEN_DAYS = LOGIN_UNEXPIRING_TOKEN_DAYS;

		// Thrown when the user cancels the login process (eg, closes an oauth
		// popup, declines retina scan, etc)
		const lceName = 'Accounts.LoginCancelledError';
		this.LoginCancelledError = Meteor.makeErrorType(lceName, function (this: any, description: string) {
			this.message = description;
		});
		this.LoginCancelledError.prototype.name = lceName;

		// This is used to transmit specific subclass errors over the wire. We
		// should come up with a more generic way to do this (eg, with some sort of
		// symbolic error code rather than a number).
		this.LoginCancelledError.numericError = 0x8acdc2f;
	}

	_initializeCollection(options: any) {
		if (options.collection && typeof options.collection !== 'string' && !(options.collection instanceof Mongo.Collection)) {
			throw new Meteor.Error('Collection parameter can be only of type string or "Mongo.Collection"');
		}

		let collectionName = 'users';
		if (typeof options.collection === 'string') {
			collectionName = options.collection;
		}

		let collection;
		if (options.collection instanceof Mongo.Collection) {
			collection = options.collection;
		} else {
			collection = new Mongo.Collection(collectionName, {
				_preventAutopublish: true,
				connection: this.connection,
			});
		}

		return collection;
	}

	/**
	 * @summary Get the current user id, or `null` if no user is logged in. A reactive data source.
	 * @locus Anywhere
	 */
	userId(): string | null {
		throw new Error('userId method not implemented');
	}

	// merge the defaultFieldSelector with an existing options object
	_addDefaultFieldSelector(options: any = {}) {
		// this will be the most common case for most people, so make it quick
		if (!this._options.defaultFieldSelector) {
			return options;
		}

		// if no field selector then just use defaultFieldSelector
		if (!options.fields)
			return {
				...options,
				fields: this._options.defaultFieldSelector,
			};

		// if empty field selector then the full user object is explicitly requested, so obey
		const keys = Object.keys(options.fields);
		if (!keys.length) {
			return options;
		}

		// if the requested fields are +ve then ignore defaultFieldSelector
		// assume they are all either +ve or -ve because Mongo doesn't like mixed
		if (options.fields[keys[0]]) {
			return options;
		}

		// The requested fields are -ve.
		// If the defaultFieldSelector is +ve then use requested fields, otherwise merge them
		const keys2 = Object.keys(this._options.defaultFieldSelector);
		return this._options.defaultFieldSelector[keys2[0]]
			? options
			: {
					...options,
					fields: {
						...options.fields,
						...this._options.defaultFieldSelector,
					},
				};
	}

	/**
	 * @summary Get the current user record, or `null` if no user is logged in. A reactive data source. In the server this fuction returns a promise.
	 * @locus Anywhere
	 * @param {Object} [options]
	 * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
	 */
	user(options?: any) {
		if (Meteor.isServer) {
			console.warn(
				[
					'`Meteor.user()` is deprecated on the server side.',
					'    To fetch the current user record on the server,',
					'    use `Meteor.userAsync()` instead.',
				].join('\n'),
			);
		}

		const userId = this.userId();
		const findOne = (...args: any[]) => (Meteor.isClient ? this.users.findOne(...args) : this.users.findOneAsync(...args));
		return userId ? findOne(userId, this._addDefaultFieldSelector(options)) : null;
	}

	/**
	 * @summary Get the current user record, or `null` if no user is logged in.
	 * @locus Anywhere
	 * @param {Object} [options]
	 * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
	 */
	async userAsync(options?: any) {
		const userId = this.userId();
		return userId ? this.users.findOneAsync(userId, this._addDefaultFieldSelector(options)) : null;
	}

	/**
	 * @summary Set global accounts options. You can also set these in `Meteor.settings.packages.accounts` without the need to call this function.
	 * @locus Anywhere
	 * @param {Object} options
	 * @param {Boolean} options.sendVerificationEmail New users with an email address will receive an address verification email.
	 * @param {Boolean} options.forbidClientAccountCreation Calls to [`createUser`](#accounts_createuser) from the client will be rejected. In addition, if you are using [accounts-ui](#accountsui), the "Create account" link will not be available. **Important**: This option must be set on both the client and server to take full effect. If only set on the server, account creation will be blocked but the UI will still show the "Create account" link.
	 * @param {String | Function} options.restrictCreationByEmailDomain If set to a string, only allows new users if the domain part of their email address matches the string. If set to a function, only allows new users if the function returns true.  The function is passed the full email address of the proposed new user.  Works with password-based sign-in and external services that expose email addresses (Google, Facebook, GitHub). All existing users still can log in after enabling this option. Example: `Accounts.config({ restrictCreationByEmailDomain: 'school.edu' })`.
	 * @param {Number} options.loginExpiration The number of milliseconds from when a user logs in until their token expires and they are logged out, for a more granular control. If `loginExpirationInDays` is set, it takes precedent.
	 * @param {Number} options.loginExpirationInDays The number of days from when a user logs in until their token expires and they are logged out. Defaults to 90. Set to `null` to disable login expiration.
	 * @param {String} options.oauthSecretKey When using the `oauth-encryption` package, the 16 byte key using to encrypt sensitive account credentials in the database, encoded in base64.  This option may only be specified on the server.  See packages/oauth-encryption/README.md for details.
	 * @param {Number} options.passwordResetTokenExpirationInDays The number of days from when a link to reset password is sent until token expires and user can't reset password with the link anymore. Defaults to 3.
	 * @param {Number} options.passwordResetTokenExpiration The number of milliseconds from when a link to reset password is sent until token expires and user can't reset password with the link anymore. If `passwordResetTokenExpirationInDays` is set, it takes precedent.
	 * @param {Number} options.passwordEnrollTokenExpirationInDays The number of days from when a link to set initial password is sent until token expires and user can't set password with the link anymore. Defaults to 30.
	 * @param {Number} options.passwordEnrollTokenExpiration The number of milliseconds from when a link to set initial password is sent until token expires and user can't set password with the link anymore. If `passwordEnrollTokenExpirationInDays` is set, it takes precedent.
	 * @param {Boolean} options.ambiguousErrorMessages Return ambiguous error messages from login failures to prevent user enumeration. Defaults to `true`.
	 * @param {Number} options.bcryptRounds Allows override of number of bcrypt rounds (aka work factor) used to store passwords. The default is 10.
	 * @param {Boolean} options.argon2Enabled Enable argon2 algorithm usage in replacement for bcrypt. The default is `false`.
	 * @param {'argon2id' | 'argon2i' | 'argon2d'} options.argon2Type Allows override of the argon2 algorithm type. The default is `argon2id`.
	 * @param {Number} options.argon2TimeCost Allows override of number of argon2 iterations (aka time cost) used to store passwords. The default is 2.
	 * @param {Number} options.argon2MemoryCost Allows override of the amount of memory (in KiB) used by the argon2 algorithm. The default is 19456 (19MB).
	 * @param {Number} options.argon2Parallelism Allows override of the number of threads used by the argon2 algorithm. The default is 1.
	 * @param {MongoFieldSpecifier} options.defaultFieldSelector To exclude by default large custom fields from `Meteor.user()` and `Meteor.findUserBy...()` functions when called without a field selector, and all `onLogin`, `onLoginFailure` and `onLogout` callbacks.  Example: `Accounts.config({ defaultFieldSelector: { myBigArray: 0 }})`. Beware when using this. If, for instance, you do not include `email` when excluding the fields, you can have problems with functions like `forgotPassword` that will break because they won't have the required data available. It's recommend that you always keep the fields `_id`, `username`, and `email`.
	 * @param {String|Mongo.Collection} options.collection A collection name or a Mongo.Collection object to hold the users.
	 * @param {Number} options.loginTokenExpirationHours When using the package `accounts-2fa`, use this to set the amount of time a token sent is valid. As it's just a number, you can use, for example, 0.5 to make the token valid for just half hour. The default is 1 hour.
	 * @param {Number} options.tokenSequenceLength When using the package `accounts-2fa`, use this to the size of the token sequence generated. The default is 6.
	 * @param {'session' | 'local'} options.clientStorage By default login credentials are stored in local storage, setting this to true will switch to using session storage.
	 *
	 * @example
	 * // For UI-related options like forbidClientAccountCreation, call Accounts.config on both client and server
	 * // Create a shared configuration file (e.g., lib/accounts-config.js):
	 * import { Accounts } from 'meteor/accounts-base';
	 *
	 * Accounts.config({
	 *   forbidClientAccountCreation: true,
	 *   sendVerificationEmail: true,
	 * });
	 *
	 * // Then import this file in both client/main.js and server/main.js:
	 * // import '../lib/accounts-config.js';
	 */
	config(options: any) {
		// We don't want users to accidentally only call Accounts.config on the
		// client, where some of the options will have partial effects (eg removing
		// the "create account" button from accounts-ui if forbidClientAccountCreation
		// is set, or redirecting Google login to a specific-domain page) without
		// having their full effects.
		if (!__meteor_runtime_config__.accountsConfigCalled) {
			// XXX would be nice to "crash" the client and replace the UI with an error
			// message, but there's no trivial way to do this.
			Meteor._debug('Accounts.config was called on the client but not on the server; some configuration options may not take effect.');
		}

		// We need to validate the oauthSecretKey option at the time
		// Accounts.config is called. We also deliberately don't store the
		// oauthSecretKey in Accounts._options.
		if (hasOwn(options, 'oauthSecretKey')) {
			throw new Error('The oauthSecretKey option may only be specified on the server');
		}

		// Validate config options keys
		for (const key of Object.keys(options)) {
			if (!VALID_CONFIG_KEYS.includes(key)) {
				console.error(`Accounts.config: Invalid key: ${key}`);
			}
		}

		// set values in Accounts._options
		for (const key of VALID_CONFIG_KEYS) {
			if (key in options) {
				if (key in this._options) {
					if (key !== 'collection' && Meteor.isTest && key !== 'clientStorage') {
						throw new Meteor.Error(`Can't set \`${key}\` more than once`);
					}
				}
				this._options[key] = options[key];
			}
		}

		if (options.collection && options.collection !== this.users._name && options.collection !== this.users) {
			this.users = this._initializeCollection(options);
		}
	}

	/**
	 * @summary Register a callback to be called after a login attempt succeeds.
	 * @locus Anywhere
	 * @param {Function} func The callback to be called when login is successful.
	 *                        The callback receives a single object that
	 *                        holds login details. This object contains the login
	 *                        result type (password, resume, etc.) on both the
	 *                        client and server. `onLogin` callbacks registered
	 *                        on the server also receive extra data, such
	 *                        as user details, connection information, etc.
	 */
	onLogin(func: (...args: any[]) => any) {
		const ret = this._onLoginHook.register(func);
		// call the just registered callback if already logged in
		this._startupCallback(ret.callback);
		return ret;
	}

	/**
	 * @summary Register a callback to be called after a login attempt fails.
	 * @locus Anywhere
	 * @param {Function} func The callback to be called after the login has failed.
	 */
	onLoginFailure(func: (...args: any[]) => any) {
		return this._onLoginFailureHook.register(func);
	}

	/**
	 * @summary Register a callback to be called after a logout attempt succeeds.
	 * @locus Anywhere
	 * @param {Function} func The callback to be called when logout is successful.
	 */
	onLogout(func: (...args: any[]) => any) {
		return this._onLogoutHook.register(func);
	}

	_initConnection(options: { connection?: Connection; ddpUrl?: string }) {
		// The connection used by the Accounts system. This is the connection
		// that will get logged in by Meteor.login(), and this is the
		// connection whose login state will be reflected by Meteor.userId().
		//
		// It would be much preferable for this to be in accounts_client.js,
		// but it has to be here because it's needed to create the
		// Meteor.users collection.
		if (options.connection) {
			this.connection = options.connection;
		}

		if (options.ddpUrl) {
			this.connection = DDP.connect(options.ddpUrl);
		}

		if (typeof __meteor_runtime_config__ !== 'undefined' && __meteor_runtime_config__.ACCOUNTS_CONNECTION_URL) {
			// Temporary, internal hook to allow the server to point the client
			// to a different authentication server. This is for a very
			// particular use case that comes up when implementing a oauth
			// server. Unsupported and may go away at any point in time.
			//
			// We will eventually provide a general way to use account-base
			// against any DDP connection, not just one special one.
			this.connection = DDP.connect(__meteor_runtime_config__.ACCOUNTS_CONNECTION_URL);
		} else {
			this.connection = Meteor.connection;
		}

		return this.connection;
	}

	_getTokenLifetimeMs() {
		// When loginExpirationInDays is set to null, we'll use a really high
		// number of days (LOGIN_UNEXPIRABLE_TOKEN_DAYS) to simulate an
		// unexpiring token.
		const loginExpirationInDays =
			this._options.loginExpirationInDays === null ? LOGIN_UNEXPIRING_TOKEN_DAYS : this._options.loginExpirationInDays;
		return this._options.loginExpiration || (loginExpirationInDays || DEFAULT_LOGIN_EXPIRATION_DAYS) * 86400000;
	}

	_getPasswordResetTokenLifetimeMs() {
		return (
			this._options.passwordResetTokenExpiration ||
			(this._options.passwordResetTokenExpirationInDays || DEFAULT_PASSWORD_RESET_TOKEN_EXPIRATION_DAYS) * 86400000
		);
	}

	_getPasswordEnrollTokenLifetimeMs() {
		return (
			this._options.passwordEnrollTokenExpiration ||
			(this._options.passwordEnrollTokenExpirationInDays || DEFAULT_PASSWORD_ENROLL_TOKEN_EXPIRATION_DAYS) * 86400000
		);
	}

	_tokenExpiration(when: any) {
		// We pass when through the Date constructor for backwards compatibility;
		// `when` used to be a number.
		return new Date(new Date(when).getTime() + this._getTokenLifetimeMs());
	}

	_tokenExpiresSoon(when: any) {
		let minLifetimeMs = 0.1 * this._getTokenLifetimeMs();
		const minLifetimeCapMs = MIN_TOKEN_LIFETIME_CAP_SECS * 1000;
		if (minLifetimeMs > minLifetimeCapMs) {
			minLifetimeMs = minLifetimeCapMs;
		}
		return new Date().getTime() > new Date(when).getTime() - minLifetimeMs;
	}

	// No-op on the server, overridden on the client.
	_startupCallback(_callback: any) {
		// no-op
	}
}

// Note that Accounts is defined separately in accounts_client.js and
// accounts_server.js.

/**
 * @summary Get the current user id, or `null` if no user is logged in. A reactive data source.
 * @locus Anywhere
 * @importFromPackage meteor
 */
Meteor.userId = () => Accounts.userId();

/**
 * @summary Get the current user record, or `null` if no user is logged in. A reactive data source.
 * @locus Anywhere
 * @importFromPackage meteor
 * @param {Object} [options]
 * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
 */
Meteor.user = (options: { fields: any }) => Accounts.user(options);

/**
 * @summary Get the current user record, or `null` if no user is logged in. A reactive data source.
 * @locus Anywhere
 * @importFromPackage meteor
 * @param {Object} [options]
 * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
 */
Meteor.userAsync = (options: any) => Accounts.userAsync(options);

// how long (in days) until a login token expires
const DEFAULT_LOGIN_EXPIRATION_DAYS = 90;
// how long (in days) until reset password token expires
const DEFAULT_PASSWORD_RESET_TOKEN_EXPIRATION_DAYS = 3;
// how long (in days) until enrol password token expires
const DEFAULT_PASSWORD_ENROLL_TOKEN_EXPIRATION_DAYS = 30;
// Clients don't try to auto-login with a token that is going to expire within
// .1 * DEFAULT_LOGIN_EXPIRATION_DAYS, capped at MIN_TOKEN_LIFETIME_CAP_SECS.
// Tries to avoid abrupt disconnects from expiring tokens.
const MIN_TOKEN_LIFETIME_CAP_SECS = 3600; // one hour
// how often (in milliseconds) we check for expired tokens
export const EXPIRE_TOKENS_INTERVAL_MS = 600 * 1000; // 10 minutes
// A large number of expiration days (approximately 100 years worth) that is
// used when creating unexpiring tokens.
const LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100;

/**
 * @summary Constructor for the `Accounts` object on the client.
 * @locus Client
 * @class AccountsClient
 * @extends AccountsCommon
 * @instancename accountsClient
 * @param {Object} options an object with fields:
 * @param {Object} options.connection Optional DDP connection to reuse.
 * @param {String} options.ddpUrl Optional URL for creating a new DDP connection.
 * @param {'session' | 'local'} options.clientStorage Optional Define what kind of storage you want for credentials on the client. Default is 'local' to use `localStorage`. Set to 'session' to use session storage.
 */
export class AccountsClient extends AccountsCommon {
	public _loggingIn: ReactiveVar<boolean>;

	public _loggingOut: ReactiveVar<boolean>;

	public _loginServicesHandle: any;

	public _pageLoadLoginCallbacks: any[];

	public _pageLoadLoginAttemptInfo: any;

	public savedHash: string;

	public storageLocation: any;

	public _loginFuncs: Record<string, (...args: any[]) => any>;

	public _loginCallbacksCalled: boolean;

	public _autoLoginEnabled: boolean;

	public _lastLoginTokenWhenPolled: string | null;

	public LOGIN_TOKEN_KEY: string;

	public LOGIN_TOKEN_EXPIRES_KEY: string;

	public USER_ID_KEY: string;

	public _pollIntervalTimer: any;

	public _accountsCallbacks: Record<string, (...args: any[]) => any>;

	public _reconnectStopper: any;

	public _resetPasswordToken: string;

	public _verifyEmailToken: string;

	public _enrollAccountToken: string;

	constructor(options: any) {
		super(options);

		this._loggingIn = new ReactiveVar(false);
		this._loggingOut = new ReactiveVar(false);

		this._loginServicesHandle = this.connection.subscribe('meteor.loginServiceConfiguration');

		this._pageLoadLoginCallbacks = [];
		this._pageLoadLoginAttemptInfo = null;

		this.savedHash = window.location.hash;
		this._initUrlMatching();

		this.initStorageLocation();

		// Defined in localstorage_token.js.
		this._initLocalStorage();

		// This is for .registerClientLoginFunction & .callLoginFunction.
		this._loginFuncs = {};

		// This tracks whether callbacks registered with
		// Accounts.onLogin have been called
		this._loginCallbacksCalled = false;
	}

	initStorageLocation(options?: any) {
		// Determine whether to use local or session storage to storage credentials and anything else.
		this.storageLocation =
			options?.clientStorage === 'session' || Meteor.settings?.public?.packages?.accounts?.clientStorage === 'session'
				? window.sessionStorage
				: Meteor._localStorage;
	}

	override config(options: any) {
		super.config(options);

		this.initStorageLocation(options);
	}

	// /
	// / CURRENT USER
	// /

	// @override
	override userId() {
		return this.connection.userId();
	}

	// This is mostly just called within this file, but Meteor.loginWithPassword
	// also uses it to make loggingIn() be true during the beginPasswordExchange
	// method call too.
	_setLoggingIn(x: boolean) {
		this._loggingIn.set(x);
	}

	/**
	 * @summary True if a login method (such as `Meteor.loginWithPassword`, `Meteor.loginWithFacebook`, or `Accounts.createUser`) is currently in progress. A reactive data source.
	 * @locus Client
	 */
	loggingIn() {
		return this._loggingIn.get();
	}

	/**
	 * @summary True if a logout method (such as `Meteor.logout`) is currently in progress. A reactive data source.
	 * @locus Client
	 */
	loggingOut() {
		return this._loggingOut.get();
	}

	/**
   * @summary Register a new login function on the client. Intended for OAuth package authors. You can call the login function by using
   `Accounts.callLoginFunction` or `Accounts.callLoginFunction`.
   * @locus Client
   * @param {String} funcName The name of your login function. Used by `Accounts.callLoginFunction` and `Accounts.applyLoginFunction`.
   Should be the OAuth provider name accordingly.
   * @param {Function} func The actual function you want to call. Just write it in the manner of `loginWithFoo`.
   */
	registerClientLoginFunction(funcName: string, func: (...args: any[]) => any) {
		if (this._loginFuncs[funcName]) {
			throw new Error(`${funcName} has been defined already`);
		}
		this._loginFuncs[funcName] = func;
	}

	/**
   * @summary Call a login function defined using `Accounts.registerClientLoginFunction`. Excluding the first argument, all remaining
   arguments are passed to the login function accordingly. Use `applyLoginFunction` if you want to pass in an arguments array that contains
   all arguments for the login function.
   * @locus Client
   * @param {String} funcName The name of the login function you wanted to call.
   */
	callLoginFunction(funcName: string, ...funcArgs: any[]) {
		if (!this._loginFuncs[funcName]) {
			throw new Error(`${funcName} was not defined`);
		}
		return this._loginFuncs[funcName].apply(this, funcArgs);
	}

	/**
   * @summary Same as ``callLoginFunction` but accept an `arguments` which contains all arguments for the login
   function.
   * @locus Client
   * @param {String} funcName The name of the login function you wanted to call.
   * @param {Array} funcArgs The `arguments` for the login function.
   */
	applyLoginFunction(funcName: string, funcArgs: any[]) {
		if (!this._loginFuncs[funcName]) {
			throw new Error(`${funcName} was not defined`);
		}
		return this._loginFuncs[funcName].apply(this, funcArgs);
	}

	/**
	 * @summary Log the user out.
	 * @locus Client
	 * @param {Function} [callback] Optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
	 */
	logout(callback?: (error?: any) => void) {
		this._loggingOut.set(true);

		this.connection
			.applyAsync('logout', [], {
				// TODO[FIBERS]: Look this { wait: true } later.
				wait: true,
			})
			.then((_result: any) => {
				this._loggingOut.set(false);
				this._loginCallbacksCalled = false;
				this.makeClientLoggedOut();
				callback?.();
			})
			.catch((e: any) => {
				this._loggingOut.set(false);
				callback?.(e);
			});
	}

	/**
	 * @summary Log out all clients logged in as the current user and logs the current user out as well.
	 * @locus Client
	 * @param {Function} [callback] Optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
	 */
	logoutAllClients(callback?: (error?: any) => void) {
		this._loggingOut.set(true);

		this.connection
			.applyAsync('logoutAllClients', [], {
				// TODO[FIBERS]: Look this { wait: true } later.
				wait: true,
			})
			.then((_result: any) => {
				this._loggingOut.set(false);
				this._loginCallbacksCalled = false;
				this.makeClientLoggedOut();
				callback?.();
			})
			.catch((e: any) => {
				this._loggingOut.set(false);
				callback?.(e);
			});
	}

	/**
	 * @summary Log out other clients logged in as the current user, but does not log out the client that calls this function.
	 * @locus Client
	 * @param {Function} [callback] Optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
	 */
	logoutOtherClients(callback?: (error?: any) => void) {
		// We need to make two method calls: one to replace our current token,
		// and another to remove all tokens except the current one. We want to
		// call these two methods one after the other, without any other
		// methods running between them. For example, we don't want `logout`
		// to be called in between our two method calls (otherwise the second
		// method call would return an error). Another example: we don't want
		// logout to be called before the callback for `getNewToken`;
		// otherwise we would momentarily log the user out and then write a
		// new token to localStorage.
		//
		// To accomplish this, we make both calls as wait methods, and queue
		// them one after the other, without spinning off the event loop in
		// between. Even though we queue `removeOtherTokens` before
		// `getNewToken`, we won't actually send the `removeOtherTokens` call
		// until the `getNewToken` callback has finished running, because they
		// are both wait methods.
		this.connection.apply('getNewToken', [], { wait: true }, (err: any, result: any) => {
			if (!err) {
				this._storeLoginToken(this.userId(), result.token, result.tokenExpires);
			}
		});

		this.connection.apply('removeOtherTokens', [], { wait: true }, (err: any) => callback?.(err));
	}

	// /
	// / LOGIN METHODS
	// /

	// Call a login method on the server.
	//
	// A login method is a method which on success calls `this.setUserId(id)` and
	// `Accounts._setLoginToken` on the server and returns an object with fields
	// 'id' (containing the user id), 'token' (containing a resume token), and
	// optionally `tokenExpires`.
	//
	// This function takes care of:
	//   - Updating the Meteor.loggingIn() reactive data source
	//   - Calling the method in 'wait' mode
	//   - On success, saving the resume token to localStorage
	//   - On success, calling Accounts.connection.setUserId()
	//   - Setting up an onReconnect handler which logs in with
	//     the resume token
	//
	// Options:
	// - methodName: The method to call (default 'login')
	// - methodArguments: The arguments for the method
	// - validateResult: If provided, will be called with the result of the
	//                 method. If it throws, the client will not be logged in (and
	//                 its error will be passed to the callback).
	// - userCallback: Will be called with no arguments once the user is fully
	//                 logged in, or with the error on error.
	//
	callLoginMethod(options: any) {
		options = {
			methodName: 'login',
			methodArguments: [{}],
			_suppressLoggingIn: false,
			...options,
		};

		// Set defaults for callback arguments to no-op functions; make sure we
		// override falsey values too.
		['validateResult', 'userCallback'].forEach((f) => {
			if (!options[f]) options[f] = () => null;
		});

		let called = false;
		// Prepare callbacks: user provided and onLogin/onLoginFailure hooks.
		const loginCallbacks = ({ error, loginDetails }: { error?: any; loginDetails?: any }) => {
			if (!called) {
				called = true;
				if (!error) {
					this._onLoginHook.forEach((callback) => {
						callback(loginDetails);
						return true;
					});
					this._loginCallbacksCalled = true;
				} else {
					this._loginCallbacksCalled = false;
					this._onLoginFailureHook.forEach((callback) => {
						callback({ error });
						return true;
					});
				}
				options.userCallback(error, loginDetails);
			}
		};

		let reconnected = false;

		// We want to set up onReconnect as soon as we get a result token back from
		// the server, without having to wait for subscriptions to rerun. This is
		// because if we disconnect and reconnect between getting the result and
		// getting the results of subscription rerun, we WILL NOT re-send this
		// method (because we never re-send methods whose results we've received)
		// but we WILL call loggedInAndDataReadyCallback at "reconnect quiesce"
		// time. This will lead to makeClientLoggedIn(result.id) even though we
		// haven't actually sent a login method!
		//
		// But by making sure that we send this "resume" login in that case (and
		// calling makeClientLoggedOut if it fails), we'll end up with an accurate
		// client-side userId. (It's important that livedata_connection guarantees
		// that the "reconnect quiesce"-time call to loggedInAndDataReadyCallback
		// will occur before the callback from the resume login call.)
		const onResultReceived = (err: any, result: any) => {
			if (err || !result || !result.token) {
				// Leave onReconnect alone if there was an error, so that if the user was
				// already logged in they will still get logged in on reconnect.
				// See issue #4970.
			} else {
				// First clear out any previously set Accounts login onReconnect
				// callback (to make sure we don't keep piling up duplicate callbacks,
				// which would then all be triggered when reconnecting).
				if (this._reconnectStopper) {
					this._reconnectStopper.stop();
				}

				this._reconnectStopper = DDP.onReconnect((conn: any) => {
					if (conn !== this.connection) {
						return;
					}
					reconnected = true;
					// If our token was updated in storage, use the latest one.
					const storedToken = this._storedLoginToken();
					if (storedToken) {
						result = {
							token: storedToken,
							tokenExpires: this._storedLoginTokenExpires(),
						};
					}
					if (!result.tokenExpires) result.tokenExpires = this._tokenExpiration(new Date());
					if (this._tokenExpiresSoon(result.tokenExpires)) {
						this.makeClientLoggedOut();
					} else {
						this.callLoginMethod({
							methodArguments: [{ resume: result.token }],
							// Reconnect quiescence ensures that the user doesn't see an
							// intermediate state before the login method finishes. So we don't
							// need to show a logging-in animation.
							_suppressLoggingIn: true,
							userCallback: (error: any, loginDetails: any) => {
								const storedTokenNow = this._storedLoginToken();
								if (error) {
									// If we had a login error AND the current stored token is the
									// one that we tried to log in with, then declare ourselves
									// logged out. If there's a token in storage but it's not the
									// token that we tried to log in with, we don't know anything
									// about whether that token is valid or not, so do nothing. The
									// periodic localStorage poll will decide if we are logged in or
									// out with this token, if it hasn't already. Of course, even
									// with this check, another tab could insert a new valid token
									// immediately before we clear localStorage here, which would
									// lead to both tabs being logged out, but by checking the token
									// in storage right now we hope to make that unlikely to happen.
									//
									// If there is no token in storage right now, we don't have to
									// do anything; whatever code removed the token from storage was
									// responsible for calling `makeClientLoggedOut()`, or the
									// periodic localStorage poll will call `makeClientLoggedOut`
									// eventually if another tab wiped the token from storage.
									if (storedTokenNow && storedTokenNow === result.token) {
										this.makeClientLoggedOut();
									}
								}
								// Possibly a weird callback to call, but better than nothing if
								// there is a reconnect between "login result received" and "data
								// ready".
								loginCallbacks({ error, loginDetails });
							},
						});
					}
				});
			}
		};

		// This callback is called once the local cache of the current-user
		// subscription (and all subscriptions, in fact) are guaranteed to be up to
		// date.
		const loggedInAndDataReadyCallback = (error: any, result: any) => {
			// If the login method returns its result but the connection is lost
			// before the data is in the local cache, it'll set an onReconnect (see
			// above). The onReconnect will try to log in using the token, and *it*
			// will call userCallback via its own version of this
			// loggedInAndDataReadyCallback. So we don't have to do anything here.
			if (reconnected) return;

			// Note that we need to call this even if _suppressLoggingIn is true,
			// because it could be matching a _setLoggingIn(true) from a
			// half-completed pre-reconnect login method.
			if (error || !result) {
				error = error || new Error(`No result from call to ${options.methodName}`);
				loginCallbacks({ error });
				this._setLoggingIn(false);
				return;
			}
			try {
				options.validateResult(result);
			} catch (e) {
				loginCallbacks({ error: e });
				this._setLoggingIn(false);
				return;
			}

			// Make the client logged in. (The user data should already be loaded!)
			this.makeClientLoggedIn(result.id, result.token, result.tokenExpires);

			// use Tracker to make we sure have a user before calling the callbacks
			void Tracker.autorun(async (computation) => {
				const user = await Tracker.withComputation(computation, () => Meteor.userAsync());

				if (user) {
					loginCallbacks({ loginDetails: result });
					this._setLoggingIn(false);
					computation.stop();
				}
			});
		};

		if (!options._suppressLoggingIn) {
			this._setLoggingIn(true);
		}
		this.connection.applyAsync(options.methodName, options.methodArguments, { wait: true, onResultReceived }, loggedInAndDataReadyCallback);
	}

	makeClientLoggedOut() {
		// Ensure client was successfully logged in before running logout hooks.
		if (this.connection._userId) {
			this._onLogoutHook.each((callback) => {
				callback();
				return true;
			});
		}
		this._unstoreLoginToken();
		this.connection.setUserId(null);
		this._reconnectStopper?.stop();
	}

	makeClientLoggedIn(userId: any, token: any, tokenExpires: any) {
		this._storeLoginToken(userId, token, tokenExpires);
		this.connection.setUserId(userId);
	}

	// /
	// / LOGIN SERVICES
	// /

	// A reactive function returning whether the loginServiceConfiguration
	// subscription is ready. Used by accounts-ui to hide the login button
	// until we have all the configuration loaded
	//
	loginServicesConfigured() {
		return this._loginServicesHandle.ready();
	}

	// Some login services such as the redirect login flow or the resume
	// login handler can log the user in at page load time.  The
	// Meteor.loginWithX functions have a callback argument, but the
	// callback function instance won't be in memory any longer if the
	// page was reloaded.  The `onPageLoadLogin` function allows a
	// callback to be registered for the case where the login was
	// initiated in a previous VM, and we now have the result of the login
	// attempt in a new VM.

	// Register a callback to be called if we have information about a
	// login attempt at page load time.  Call the callback immediately if
	// we already have the page load login attempt info, otherwise stash
	// the callback to be called if and when we do get the attempt info.
	//
	onPageLoadLogin(f: (...args: any[]) => any) {
		if (this._pageLoadLoginAttemptInfo) {
			f(this._pageLoadLoginAttemptInfo);
		} else {
			this._pageLoadLoginCallbacks.push(f);
		}
	}

	// Receive the information about the login attempt at page load time.
	// Call registered callbacks, and also record the info in case
	// someone's callback hasn't been registered yet.
	//
	_pageLoadLogin(attemptInfo: any) {
		if (this._pageLoadLoginAttemptInfo) {
			Meteor._debug('Ignoring unexpected duplicate page load login attempt info');
			return;
		}

		this._pageLoadLoginCallbacks.forEach((callback: (...args: any[]) => any) => callback(attemptInfo));
		this._pageLoadLoginCallbacks = [];
		this._pageLoadLoginAttemptInfo = attemptInfo;
	}

	// _startupCallback executes on onLogin callbacks
	// at registration time if already logged in
	// this can happen when new AccountsClient is created
	// before callbacks are registered see #10157
	override _startupCallback(callback: (...args: any[]) => any) {
		// Are we already logged in?
		if (this._loginCallbacksCalled) {
			// If already logged in before handler is registered, it's safe to
			// assume type is a 'resume', so we execute the callback at the end
			// of the queue so that Meteor.startup can complete before any
			// embedded onLogin callbacks would execute.
			Meteor.setTimeout(() => callback({ type: 'resume' }), 0);
		}
	}

	// /
	// / LOGIN TOKENS
	// /

	// These methods deal with storing a login token and user id in the
	// browser's localStorage facility. It polls local storage every few
	// seconds to synchronize login state between multiple tabs in the same
	// browser.

	loginWithToken(token: any, callback: (error?: any) => void) {
		this.callLoginMethod({
			methodArguments: [
				{
					resume: token,
				},
			],
			userCallback: callback,
		});
	}

	// Semi-internal API. Call this function to re-enable auto login after
	// if it was disabled at startup.
	_enableAutoLogin() {
		this._autoLoginEnabled = true;
		this._pollStoredLoginToken();
	}

	// /
	// / STORING
	// /

	// Call this from the top level of the test file for any test that does
	// logging in and out, to protect multiple tabs running the same tests
	// simultaneously from interfering with each others' localStorage.
	_isolateLoginTokenForTest() {
		this.LOGIN_TOKEN_KEY += Random.id();
		this.USER_ID_KEY += Random.id();
	}

	_storeLoginToken(userId: string | null, token: string, tokenExpires: any) {
		this.storageLocation.setItem(this.USER_ID_KEY, userId);
		this.storageLocation.setItem(this.LOGIN_TOKEN_KEY, token);
		if (!tokenExpires) tokenExpires = this._tokenExpiration(new Date());
		this.storageLocation.setItem(this.LOGIN_TOKEN_EXPIRES_KEY, tokenExpires);

		// to ensure that the localstorage poller doesn't end up trying to
		// connect a second time
		this._lastLoginTokenWhenPolled = token;
	}

	_unstoreLoginToken() {
		this.storageLocation.removeItem(this.USER_ID_KEY);
		this.storageLocation.removeItem(this.LOGIN_TOKEN_KEY);
		this.storageLocation.removeItem(this.LOGIN_TOKEN_EXPIRES_KEY);

		// to ensure that the localstorage poller doesn't end up trying to
		// connect a second time
		this._lastLoginTokenWhenPolled = null;
	}

	// This is private, but it is exported for now because it is used by a
	// test in accounts-password.
	_storedLoginToken() {
		return this.storageLocation.getItem(this.LOGIN_TOKEN_KEY);
	}

	_storedLoginTokenExpires() {
		return this.storageLocation.getItem(this.LOGIN_TOKEN_EXPIRES_KEY);
	}

	_storedUserId() {
		return this.storageLocation.getItem(this.USER_ID_KEY);
	}

	_unstoreLoginTokenIfExpiresSoon() {
		const tokenExpires = this._storedLoginTokenExpires();
		if (tokenExpires && this._tokenExpiresSoon(new Date(tokenExpires))) {
			this._unstoreLoginToken();
		}
	}

	// /
	// / AUTO-LOGIN
	// /

	_initLocalStorage() {
		// Key names to use in localStorage
		this.LOGIN_TOKEN_KEY = 'Meteor.loginToken';
		this.LOGIN_TOKEN_EXPIRES_KEY = 'Meteor.loginTokenExpires';
		this.USER_ID_KEY = 'Meteor.userId';

		const rootUrlPathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
		if (rootUrlPathPrefix || this.connection !== Meteor.connection) {
			// We want to keep using the same keys for existing apps that do not
			// set a custom ROOT_URL_PATH_PREFIX, so that most users will not have
			// to log in again after an app updates to a version of Meteor that
			// contains this code, but it's generally preferable to namespace the
			// keys so that connections from distinct apps to distinct DDP URLs
			// will be distinct in Meteor._localStorage.
			let namespace = `:${this.connection._stream.rawUrl}`;
			if (rootUrlPathPrefix) {
				namespace += `:${rootUrlPathPrefix}`;
			}
			this.LOGIN_TOKEN_KEY += namespace;
			this.LOGIN_TOKEN_EXPIRES_KEY += namespace;
			this.USER_ID_KEY += namespace;
		}

		let token: string | null = null;
		if (this._autoLoginEnabled) {
			// Immediately try to log in via local storage, so that any DDP
			// messages are sent after we have established our user account
			this._unstoreLoginTokenIfExpiresSoon();
			token = this._storedLoginToken();
			if (token) {
				// On startup, optimistically present us as logged in while the
				// request is in flight. This reduces page flicker on startup.
				const userId = this._storedUserId();
				userId && this.connection.setUserId(userId);
				this.loginWithToken(token, (err) => {
					if (err) {
						Meteor._debug(`Error logging in with token: ${err}`);
						this.makeClientLoggedOut();
					}

					this._pageLoadLogin({
						type: 'resume',
						allowed: !err,
						error: err,
						methodName: 'login',
						// XXX This is duplicate code with loginWithToken, but
						// loginWithToken can also be called at other times besides
						// page load.
						methodArguments: [{ resume: token }],
					});
				});
			}
		}

		// Poll local storage every 3 seconds to login if someone logged in in
		// another tab
		this._lastLoginTokenWhenPolled = token;

		if (this._pollIntervalTimer) {
			// Unlikely that _initLocalStorage will be called more than once for
			// the same AccountsClient instance, but just in case...
			clearInterval(this._pollIntervalTimer);
		}

		this._pollIntervalTimer = setInterval(() => {
			this._pollStoredLoginToken();
		}, 3000);
	}

	_pollStoredLoginToken() {
		if (!this._autoLoginEnabled) {
			return;
		}

		const currentLoginToken = this._storedLoginToken();

		// != instead of !== just to make sure undefined and null are treated the same
		if (this._lastLoginTokenWhenPolled !== currentLoginToken) {
			if (currentLoginToken) {
				this.loginWithToken(currentLoginToken, (err) => {
					if (err) {
						this.makeClientLoggedOut();
					}
				});
			} else {
				this.logout();
			}
		}

		this._lastLoginTokenWhenPolled = currentLoginToken;
	}

	// /
	// / URLS
	// /

	_initUrlMatching() {
		// By default, allow the autologin process to happen.
		this._autoLoginEnabled = true;

		// We only support one callback per URL.
		this._accountsCallbacks = {};

		// Try to match the saved value of window.location.hash.
		this._attemptToMatchHash();
	}

	// Separate out this functionality for testing
	_attemptToMatchHash() {
		attemptToMatchHash(this, this.savedHash, defaultSuccessHandler);
	}

	/**
	 * @summary Register a function to call when a reset password link is clicked
	 * in an email sent by
	 * [`Accounts.sendResetPasswordEmail`](#Accounts-sendResetPasswordEmail).
	 * This function should be called in top-level code, not inside
	 * `Meteor.startup()`.
	 * @memberof! Accounts
	 * @name onResetPasswordLink
	 * @param  {Function} callback The function to call. It is given two arguments:
	 *
	 * 1. `token`: A password reset token that can be passed to
	 * [`Accounts.resetPassword`](#Accounts-resetPassword).
	 * 2. `done`: A function to call when the password reset UI flow is complete. The normal
	 * login process is suspended until this function is called, so that the
	 * password for user A can be reset even if user B was logged in.
	 * @locus Client
	 */
	onResetPasswordLink(callback: (...args: any[]) => any) {
		if (this._accountsCallbacks['reset-password']) {
			Meteor._debug('Accounts.onResetPasswordLink was called more than once. Only one callback added will be executed.');
		}

		this._accountsCallbacks['reset-password'] = callback;
	}

	/**
	 * @summary Register a function to call when an email verification link is
	 * clicked in an email sent by
	 * [`Accounts.sendVerificationEmail`](#Accounts-sendVerificationEmail).
	 * This function should be called in top-level code, not inside
	 * `Meteor.startup()`.
	 * @memberof! Accounts
	 * @name onEmailVerificationLink
	 * @param  {Function} callback The function to call. It is given two arguments:
	 *
	 * 1. `token`: An email verification token that can be passed to
	 * [`Accounts.verifyEmail`](#Accounts-verifyEmail).
	 * 2. `done`: A function to call when the email verification UI flow is complete.
	 * The normal login process is suspended until this function is called, so
	 * that the user can be notified that they are verifying their email before
	 * being logged in.
	 * @locus Client
	 */
	onEmailVerificationLink(callback: (...args: any[]) => any) {
		if (this._accountsCallbacks['verify-email']) {
			Meteor._debug('Accounts.onEmailVerificationLink was called more than once. Only one callback added will be executed.');
		}

		this._accountsCallbacks['verify-email'] = callback;
	}

	/**
	 * @summary Register a function to call when an account enrollment link is
	 * clicked in an email sent by
	 * [`Accounts.sendEnrollmentEmail`](#Accounts-sendEnrollmentEmail).
	 * This function should be called in top-level code, not inside
	 * `Meteor.startup()`.
	 * @memberof! Accounts
	 * @name onEnrollmentLink
	 * @param  {Function} callback The function to call. It is given two arguments:
	 *
	 * 1. `token`: A password reset token that can be passed to
	 * [`Accounts.resetPassword`](#Accounts-resetPassword) to give the newly
	 * enrolled account a password.
	 * 2. `done`: A function to call when the enrollment UI flow is complete.
	 * The normal login process is suspended until this function is called, so that
	 * user A can be enrolled even if user B was logged in.
	 * @locus Client
	 */
	onEnrollmentLink(callback: (...args: any[]) => any) {
		if (this._accountsCallbacks['enroll-account']) {
			Meteor._debug('Accounts.onEnrollmentLink was called more than once. Only one callback added will be executed.');
		}

		this._accountsCallbacks['enroll-account'] = callback;
	}
}

/**
 * @summary True if a login method (such as `Meteor.loginWithPassword`,
 * `Meteor.loginWithFacebook`, or `Accounts.createUser`) is currently in
 * progress. A reactive data source.
 * @locus Client
 * @importFromPackage meteor
 */
Meteor.loggingIn = () => Accounts.loggingIn();

/**
 * @summary True if a logout method (such as `Meteor.logout`) is currently in
 * progress. A reactive data source.
 * @locus Client
 * @importFromPackage meteor
 */
Meteor.loggingOut = () => Accounts.loggingOut();

/**
 * @summary Log the user out.
 * @locus Client
 * @param {Function} [callback] Optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
 * @importFromPackage meteor
 */
Meteor.logout = (callback?: (error?: any) => void) => Accounts.logout(callback);

/**
 * @summary Log out all clients logged in as the current user and logs the current user out as well.
 * @locus Client
 * @param {Function} [callback] Optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
 * @importFromPackage meteor
 */
Meteor.logoutAllClients = (callback?: (error?: any) => void) => Accounts.logoutAllClients(callback);

/**
 * @summary Log out other clients logged in as the current user, but does not log out the client that calls this function.
 * @locus Client
 * @param {Function} [callback] Optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
 * @importFromPackage meteor
 */
Meteor.logoutOtherClients = (callback?: (error?: any) => void) => Accounts.logoutOtherClients(callback);

/**
 * @summary Login with a Meteor access token.
 * @locus Client
 * @param {Object} [token] Local storage token for use with login across
 * multiple tabs in the same browser.
 * @param {Function} [callback] Optional callback. Called with no arguments on
 * success.
 * @importFromPackage meteor
 */
Meteor.loginWithToken = (token: any, callback: (error?: any) => void) => Accounts.loginWithToken(token, callback);

// /
// / HANDLEBARS HELPERS
// /

// If our app has a Blaze, register the {{currentUser}} and {{loggingIn}}
// global helpers.
if (Package.blaze) {
	const { Template } = Package.blaze.Blaze;

	/**
	 * @global
	 * @name  currentUser
	 * @isHelper true
	 * @summary Calls [Meteor.user()](#meteor_user). Use `{{#if currentUser}}` to check whether the user is logged in.
	 */
	Template.registerHelper('currentUser', () => Meteor.user());

	// TODO: the code above needs to be changed to Meteor.userAsync() when we have
	// a way to make it reactive using async.
	// Template.registerHelper('currentUserAsync',
	//  async () => await Meteor.userAsync());

	/**
	 * @global
	 * @name  loggingIn
	 * @isHelper true
	 * @summary Calls [Meteor.loggingIn()](#meteor_loggingin).
	 */
	Template.registerHelper('loggingIn', () => Meteor.loggingIn());

	/**
	 * @global
	 * @name  loggingOut
	 * @isHelper true
	 * @summary Calls [Meteor.loggingOut()](#meteor_loggingout).
	 */
	Template.registerHelper('loggingOut', () => Meteor.loggingOut());

	/**
	 * @global
	 * @name  loggingInOrOut
	 * @isHelper true
	 * @summary Calls [Meteor.loggingIn()](#meteor_loggingin) or [Meteor.loggingOut()](#meteor_loggingout).
	 */
	Template.registerHelper('loggingInOrOut', () => Meteor.loggingIn() || Meteor.loggingOut());
}

const defaultSuccessHandler = function (this: any, token: string, urlPart: string) {
	// put login in a suspended state to wait for the interaction to finish
	this._autoLoginEnabled = false;

	// wait for other packages to register callbacks
	Meteor.startup(() => {
		// if a callback has been registered for this kind of token, call it
		if (this._accountsCallbacks[urlPart]) {
			this._accountsCallbacks[urlPart](token, () => this._enableAutoLogin());
		}
	});
};

// Note that both arguments are optional and are currently only passed by
// accounts_url_tests.js.
const attemptToMatchHash = (accounts: any, hash: string, success: (...args: any[]) => any) => {
	// All of the special hash URLs we support for accounts interactions
	['reset-password', 'verify-email', 'enroll-account'].forEach((urlPart) => {
		let token;

		const tokenRegex = new RegExp(`^\\#\\/${urlPart}\\/(.*)$`);
		const match = hash.match(tokenRegex);

		if (match) {
			token = match[1];

			// XXX COMPAT WITH 0.9.3
			if (urlPart === 'reset-password') {
				accounts._resetPasswordToken = token;
			} else if (urlPart === 'verify-email') {
				accounts._verifyEmailToken = token;
			} else if (urlPart === 'enroll-account') {
				accounts._enrollAccountToken = token;
			}
		} else {
			return;
		}

		// If no handlers match the hash, then maybe it's meant to be consumed
		// by some entirely different code, so we only clear it the first time
		// a handler successfully matches. Note that later handlers reuse the
		// savedHash, so clearing window.location.hash here will not interfere
		// with their needs.
		window.location.hash = '';

		// Do some stuff with the token we matched
		success.call(accounts, token, urlPart);
	});
};

// Export for testing
export const AccountsTest = {
	attemptToMatchHash: (hash: string, success: (...args: any[]) => any) => attemptToMatchHash(Accounts, hash, success),
};

/**
 * @namespace Accounts
 * @summary The namespace for all client-side accounts-related methods.
 */
export const Accounts = new AccountsClient(Meteor.settings?.public?.packages?.accounts || {});

/**
 * @summary A [Mongo.Collection](#collections) containing user documents.
 * @locus Anywhere
 * @type {Mongo.Collection}
 * @importFromPackage meteor
 */
Meteor.users = Accounts.users;

Package['accounts-base'] = {
	Accounts,
	AccountsClient,
	AccountsTest,
};
