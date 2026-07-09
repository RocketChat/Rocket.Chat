import { Hook } from './callback-hook.ts';
import { DDP, type Connection } from './ddp-client.ts';
import { MeteorError } from './meteor.ts';
import { Collection } from './mongo.ts';
import { Random } from './random.ts';
import { ReactiveVar } from './reactive-var.ts';
import { Tracker } from './tracker.ts';
import { isKey } from './utils/isKey.ts';
import { keys } from './utils/keys.ts';

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
] as const;

type AccountsClientOptions = {
	sendVerificationEmail?: boolean;
	forbidClientAccountCreation?: boolean;
	restrictCreationByEmailDomain?: boolean;
	loginExpiration?: number;
	loginExpirationInDays?: number;
	oauthSecretKey?: string;
	passwordResetTokenExpirationInDays?: number;
	passwordResetTokenExpiration?: number;
	passwordEnrollTokenExpirationInDays?: number;
	passwordEnrollTokenExpiration?: number;
	ambiguousErrorMessages?: boolean;
	bcryptRounds?: number;
	argon2Enabled?: boolean;
	argon2Type?: number;
	argon2TimeCost?: number;
	argon2MemoryCost?: number;
	argon2Parallelism?: number;
	defaultFieldSelector?: Record<string, any>;
	collection?: Collection | string;
	loginTokenExpirationHours?: number;
	tokenSequenceLength?: number;
	clientStorage?: 'local' | 'session';
	ddpUrl?: string;
	connection?: Connection;
};
const DEFAULT_LOGIN_EXPIRATION_DAYS = 90;
const DEFAULT_PASSWORD_RESET_TOKEN_EXPIRATION_DAYS = 3;
const DEFAULT_PASSWORD_ENROLL_TOKEN_EXPIRATION_DAYS = 30;
const MIN_TOKEN_LIFETIME_CAP_SECS = 3600; // one hour
const LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100;

export class LoginCancelledError extends Error {
	numericError = 0x8acdc2f;

	override name = 'Accounts.LoginCancelledError';
}

const URL_PARTS = [
	{ key: 'reset-password', regex: /^#\/reset-password\/(.*)$/, property: '_resetPasswordToken' },
	{ key: 'verify-email', regex: /^#\/verify-email\/(.*)$/, property: '_verifyEmailToken' },
	{ key: 'enroll-account', regex: /^#\/enroll-account\/(.*)$/, property: '_enrollAccountToken' },
] as const;

type AttemptInfo = { type: string; allowed: boolean; error: any; methodName: string; methodArguments: [{ resume: string | null }] };

export class AccountsClient {
	public _options: AccountsClientOptions;

	public connection: Connection = DDP.connection;

	public users: any;

	public _onLoginHook = new Hook<
		[{ type: 'resume' | 'normal'; allowed?: boolean; error?: any; methodName?: string; methodArguments?: any[] }]
	>({
		bindEnvironment: false,
		debugPrintExceptions: 'onLogin callback',
	});

	public _onLoginFailureHook = new Hook<[{ error: any }]>({
		bindEnvironment: false,
		debugPrintExceptions: 'onLoginFailure callback',
	});

	public _onLogoutHook = new Hook<[]>({
		bindEnvironment: false,
		debugPrintExceptions: 'onLogout callback',
	});

	public DEFAULT_LOGIN_EXPIRATION_DAYS = DEFAULT_LOGIN_EXPIRATION_DAYS;

	public LOGIN_UNEXPIRING_TOKEN_DAYS = LOGIN_UNEXPIRING_TOKEN_DAYS;

	public LoginCancelledError = LoginCancelledError;

	public _loggingIn = new ReactiveVar(false);

	public _loggingOut = new ReactiveVar(false);

	public _loginServicesHandle: any;

	public _pageLoadLoginCallbacks: Array<(...args: any[]) => any> = [];

	public _pageLoadLoginAttemptInfo: AttemptInfo | null = null;

	public savedHash: string;

	public storageLocation: Storage;

	public _loginFuncs: Record<string, (...args: any[]) => any>;

	public _loginCallbacksCalled: boolean;

	public _autoLoginEnabled = false;

	public _lastLoginTokenWhenPolled: string | null = null;

	public LOGIN_TOKEN_KEY = 'Meteor.loginToken';

	public LOGIN_TOKEN_EXPIRES_KEY = 'Meteor.loginTokenExpires';

	public USER_ID_KEY = 'Meteor.userId';

	public _pollIntervalTimer: any;

	public _accountsCallbacks: Partial<Record<(typeof URL_PARTS)[number]['key'], (...args: any[]) => any>> = {};

	public _reconnectStopper: any;

	public _resetPasswordToken: string | undefined;

	public _verifyEmailToken: string | undefined;

	public _enrollAccountToken: string | undefined;

	constructor(options: AccountsClientOptions = {}) {
		for (const key of keys(options)) {
			if (!VALID_CONFIG_KEYS.includes(key)) {
				console.error(`Accounts.config: Invalid key: ${key}`);
			}
		}

		this._options = options || {};
		this.connection = this._initConnection(options || {});
		this.users = this._initializeCollection(options || {});

		this._loginServicesHandle = this.connection.subscribe('meteor.loginServiceConfiguration');

		this.savedHash = window.location.hash;
		this._autoLoginEnabled = true;
		this._attemptToMatchHash();

		this.storageLocation = localStorage;
		this._initLocalStorage();
		this._loginFuncs = {};
		this._loginCallbacksCalled = false;
	}

	_initializeCollection(options: AccountsClientOptions) {
		if (options.collection && typeof options.collection !== 'string' && !(options.collection instanceof Collection)) {
			throw new MeteorError('Collection parameter can be only of type string or "Mongo.Collection"');
		}

		let collectionName = 'users';
		if (typeof options.collection === 'string') {
			collectionName = options.collection;
		}

		return options.collection instanceof Collection
			? options.collection
			: new Collection(collectionName, {
					_preventAutopublish: true,
					connection: this.connection,
				});
	}

	_addDefaultFieldSelector(options: any = {}) {
		if (!this._options.defaultFieldSelector) {
			return options;
		}
		if (!options.fields)
			return {
				...options,
				fields: this._options.defaultFieldSelector,
			};
		const keys = Object.keys(options.fields);
		if (!keys.length) {
			return options;
		}
		if (options.fields[keys[0]]) {
			return options;
		}
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

	user(options?: any) {
		const userId = this.userId();
		const findOne = (...args: any[]) => this.users.findOne(...args);
		return userId ? findOne(userId, this._addDefaultFieldSelector(options)) : null;
	}

	async userAsync(options?: any) {
		const userId = this.userId();
		return userId ? this.users.findOneAsync(userId, this._addDefaultFieldSelector(options)) : null;
	}

	onLogin(func: (...args: any[]) => any) {
		const ret = this._onLoginHook.register(func);
		this._startupCallback(ret.callback);
		return ret;
	}

	onLoginFailure(func: (...args: any[]) => any) {
		return this._onLoginFailureHook.register(func);
	}

	onLogout(func: (...args: any[]) => any) {
		return this._onLogoutHook.register(func);
	}

	_initConnection(options: AccountsClientOptions) {
		if (options.connection) {
			this.connection = options.connection;
		}

		if (options.ddpUrl) {
			this.connection = DDP.connect(options.ddpUrl);
		}

		return this.connection;
	}

	_getTokenLifetimeMs(): number {
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

	initStorageLocation(options?: any) {
		this.storageLocation = options && options.clientStorage === 'session' ? sessionStorage : localStorage;
	}

	config(options: AccountsClientOptions) {
		if (!__meteor_runtime_config__.accountsConfigCalled) {
			console.debug('Accounts.config was called on the client but not on the server; some configuration options may not take effect.');
		}

		if (isKey(options, 'oauthSecretKey')) {
			throw new Error('The oauthSecretKey option may only be specified on the server');
		}
		for (const key of keys(options)) {
			if (!VALID_CONFIG_KEYS.includes(key)) {
				console.error(`Accounts.config: Invalid key: ${key}`);
			}
		}

		if (options.collection && options.collection !== this.users._name && options.collection !== this.users) {
			this.users = this._initializeCollection(options);
		}
		this.initStorageLocation(options);
	}

	userId() {
		return this.connection.userId();
	}

	_setLoggingIn(x: boolean) {
		this._loggingIn.set(x);
	}

	loggingIn() {
		return this._loggingIn.get();
	}

	loggingOut() {
		return this._loggingOut.get();
	}

	registerClientLoginFunction(funcName: string, func: (...args: any[]) => any) {
		if (this._loginFuncs[funcName]) {
			throw new Error(`${funcName} has been defined already`);
		}
		this._loginFuncs[funcName] = func;
	}

	callLoginFunction(funcName: string, ...funcArgs: any[]) {
		if (!this._loginFuncs[funcName]) {
			throw new Error(`${funcName} was not defined`);
		}
		return this._loginFuncs[funcName].apply(this, funcArgs);
	}

	applyLoginFunction(funcName: string, funcArgs: any[]) {
		if (!this._loginFuncs[funcName]) {
			throw new Error(`${funcName} was not defined`);
		}
		return this._loginFuncs[funcName].apply(this, funcArgs);
	}

	logout(callback?: (error?: any) => void) {
		this._loggingOut.set(true);

		this.connection
			.applyAsync('logout', [], {
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

	logoutAllClients(callback?: (error?: any) => void) {
		this._loggingOut.set(true);

		this.connection
			.applyAsync('logoutAllClients', [], {
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

	logoutOtherClients(callback?: (error?: any) => void) {
		this.connection.apply('getNewToken', [], { wait: true }, (err: any, result: any) => {
			const userId = this.userId();
			if (!err && userId) {
				this._storeLoginToken(userId, result.token, result.tokenExpires);
			}
		});

		this.connection.apply('removeOtherTokens', [], { wait: true }, (err: any) => callback?.(err));
	}

	callLoginMethod(options: any) {
		options = {
			methodName: 'login',
			methodArguments: [{}],
			_suppressLoggingIn: false,
			...options,
		};

		['validateResult', 'userCallback'].forEach((f) => {
			if (!options[f]) options[f] = () => null;
		});

		let called = false;
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

		const onResultReceived = (err: any, result: any) => {
			if (err || !result || !result.token) {
				// error handling
			} else {
				if (this._reconnectStopper) {
					this._reconnectStopper.stop();
				}

				this._reconnectStopper = DDP.onReconnect((conn) => {
					if (conn !== this.connection) {
						return;
					}
					reconnected = true;
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
							_suppressLoggingIn: true,
							userCallback: (error: any, loginDetails: any) => {
								const storedTokenNow = this._storedLoginToken();
								if (error) {
									if (storedTokenNow && storedTokenNow === result.token) {
										this.makeClientLoggedOut();
									}
								}
								loginCallbacks({ error, loginDetails });
							},
						});
					}
				});
			}
		};

		const loggedInAndDataReadyCallback = (error: any, result: any) => {
			if (reconnected) return;

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

			this.makeClientLoggedIn(result.id, result.token, result.tokenExpires);

			void Tracker.autorun(async (computation) => {
				const user = await Tracker.withComputation(computation, () => this.userAsync());

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
		void this.connection.applyAsync(
			options.methodName,
			options.methodArguments,
			{ wait: true, onResultReceived },
			loggedInAndDataReadyCallback,
		);
	}

	makeClientLoggedOut() {
		if (this.connection._userId) {
			this._onLogoutHook.forEach((callback) => {
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

	loginServicesConfigured() {
		return this._loginServicesHandle.ready();
	}

	onPageLoadLogin(f: (...args: any[]) => any) {
		if (this._pageLoadLoginAttemptInfo) {
			f(this._pageLoadLoginAttemptInfo);
		} else {
			this._pageLoadLoginCallbacks.push(f);
		}
	}

	_pageLoadLogin(attemptInfo: AttemptInfo) {
		if (this._pageLoadLoginAttemptInfo) {
			console.debug('Ignoring unexpected duplicate page load login attempt info');
			return;
		}

		this._pageLoadLoginCallbacks.forEach((callback: (...args: any[]) => any) => callback(attemptInfo));
		this._pageLoadLoginCallbacks = [];
		this._pageLoadLoginAttemptInfo = attemptInfo;
	}

	_startupCallback(callback: (...args: any[]) => any) {
		if (this._loginCallbacksCalled) {
			setTimeout(() => callback({ type: 'resume' }), 0);
		}
	}

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

	_enableAutoLogin() {
		this._autoLoginEnabled = true;
		this._pollStoredLoginToken();
	}

	_isolateLoginTokenForTest() {
		this.LOGIN_TOKEN_KEY += Random.id();
		this.USER_ID_KEY += Random.id();
	}

	_storeLoginToken(userId: string, token: string, tokenExpires: any) {
		this.storageLocation.setItem(this.USER_ID_KEY, userId);
		this.storageLocation.setItem(this.LOGIN_TOKEN_KEY, token);
		if (!tokenExpires) tokenExpires = this._tokenExpiration(new Date());
		this.storageLocation.setItem(this.LOGIN_TOKEN_EXPIRES_KEY, tokenExpires);

		this._lastLoginTokenWhenPolled = token;
	}

	_unstoreLoginToken() {
		this.storageLocation.removeItem(this.USER_ID_KEY);
		this.storageLocation.removeItem(this.LOGIN_TOKEN_KEY);
		this.storageLocation.removeItem(this.LOGIN_TOKEN_EXPIRES_KEY);
		this._lastLoginTokenWhenPolled = null;
	}

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

	_initLocalStorage() {
		const rootUrlPathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
		if (rootUrlPathPrefix || this.connection !== DDP.connection) {
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
			this._unstoreLoginTokenIfExpiresSoon();
			token = this._storedLoginToken();
			if (token) {
				const userId = this._storedUserId();
				userId && this.connection.setUserId(userId);
				this.loginWithToken(token, (err) => {
					if (err) {
						console.debug(`Error logging in with token: ${err}`);
						this.makeClientLoggedOut();
					}

					this._pageLoadLogin({
						type: 'resume',
						allowed: !err,
						error: err,
						methodName: 'login',
						methodArguments: [{ resume: token }],
					});
				});
			}
		}

		this._lastLoginTokenWhenPolled = token;

		if (this._pollIntervalTimer) {
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

	_attemptToMatchHash() {
		for (const urlPart of URL_PARTS) {
			const match = this.savedHash.match(urlPart.regex);
			if (!match) continue;

			const token = match[1];
			this[urlPart.property] = token;
			window.location.hash = '';

			this._autoLoginEnabled = false;

			if (this._accountsCallbacks[urlPart.key]) {
				this._accountsCallbacks[urlPart.key]?.(token, () => this._enableAutoLogin());
			}

			return;
		}
	}

	onResetPasswordLink(callback: (...args: any[]) => any) {
		if (this._accountsCallbacks['reset-password']) {
			console.debug('Accounts.onResetPasswordLink was called more than once. Only one callback added will be executed.');
		}

		this._accountsCallbacks['reset-password'] = callback;
	}

	onEmailVerificationLink(callback: (...args: any[]) => any) {
		if (this._accountsCallbacks['verify-email']) {
			console.debug('Accounts.onEmailVerificationLink was called more than once. Only one callback added will be executed.');
		}

		this._accountsCallbacks['verify-email'] = callback;
	}

	onEnrollmentLink(callback: (...args: any[]) => any) {
		if (this._accountsCallbacks['enroll-account']) {
			console.debug('Accounts.onEnrollmentLink was called more than once. Only one callback added will be executed.');
		}

		this._accountsCallbacks['enroll-account'] = callback;
	}
}

export const Accounts = new AccountsClient();
