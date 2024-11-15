import { AccountsCommon } from './accounts_common.js';

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
	constructor(options) {
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

	initStorageLocation(options) {
		// Determine whether to use local or session storage to storage credentials and anything else.
		this.storageLocation =
			options?.clientStorage === 'session' || Meteor.settings?.public?.packages?.accounts?.clientStorage === 'session'
				? window.sessionStorage
				: Meteor._localStorage;
	}

	config(options) {
		super.config(options);

		this.initStorageLocation(options);
	}

	///
	/// CURRENT USER
	///

	// @override
	userId() {
		return this.connection.userId();
	}

	// This is mostly just called within this file, but Meteor.loginWithPassword
	// also uses it to make loggingIn() be true during the beginPasswordExchange
	// method call too.
	_setLoggingIn(x) {
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
	registerClientLoginFunction(funcName, func) {
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
	callLoginFunction(funcName, ...funcArgs) {
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
	applyLoginFunction(funcName, funcArgs) {
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
	logout(callback) {
		this._loggingOut.set(true);

		this.connection
			.applyAsync('logout', [], {
				// TODO[FIBERS]: Look this { wait: true } later.
				wait: true,
			})
			.then((result) => {
				this._loggingOut.set(false);
				this._loginCallbacksCalled = false;
				this.makeClientLoggedOut();
				callback && callback();
			})
			.catch((e) => {
				this._loggingOut.set(false);
				callback && callback(e);
			});
	}

	/**
	 * @summary Log out other clients logged in as the current user, but does not log out the client that calls this function.
	 * @locus Client
	 * @param {Function} [callback] Optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
	 */
	logoutOtherClients(callback) {
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
		this.connection.apply('getNewToken', [], { wait: true }, (err, result) => {
			if (!err) {
				this._storeLoginToken(this.userId(), result.token, result.tokenExpires);
			}
		});

		this.connection.apply('removeOtherTokens', [], { wait: true }, (err) => callback && callback(err));
	}

	///
	/// LOGIN METHODS
	///

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
	callLoginMethod(options) {
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

		let called;
		// Prepare callbacks: user provided and onLogin/onLoginFailure hooks.
		const loginCallbacks = ({ error, loginDetails }) => {
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
		const onResultReceived = (err, result) => {
			if (err || !result || !result.token) {
				// Leave onReconnect alone if there was an error, so that if the user was
				// already logged in they will still get logged in on reconnect.
				// See issue #4970.
			} else {
				// First clear out any previously set Acccounts login onReconnect
				// callback (to make sure we don't keep piling up duplicate callbacks,
				// which would then all be triggered when reconnecting).
				if (this._reconnectStopper) {
					this._reconnectStopper.stop();
				}

				this._reconnectStopper = DDP.onReconnect((conn) => {
					if (conn != this.connection) {
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
							userCallback: (error, loginDetails) => {
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
		const loggedInAndDataReadyCallback = (error, result) => {
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
			Tracker.autorun(async (computation) => {
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
		this._reconnectStopper && this._reconnectStopper.stop();
	}

	makeClientLoggedIn(userId, token, tokenExpires) {
		this._storeLoginToken(userId, token, tokenExpires);
		this.connection.setUserId(userId);
	}

	///
	/// LOGIN SERVICES
	///

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
	onPageLoadLogin(f) {
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
	_pageLoadLogin(attemptInfo) {
		if (this._pageLoadLoginAttemptInfo) {
			Meteor._debug('Ignoring unexpected duplicate page load login attempt info');
			return;
		}

		this._pageLoadLoginCallbacks.forEach((callback) => callback(attemptInfo));
		this._pageLoadLoginCallbacks = [];
		this._pageLoadLoginAttemptInfo = attemptInfo;
	}

	// _startupCallback executes on onLogin callbacks
	// at registration time if already logged in
	// this can happen when new AccountsClient is created
	// before callbacks are registered see #10157
	_startupCallback(callback) {
		// Are we already logged in?
		if (this._loginCallbacksCalled) {
			// If already logged in before handler is registered, it's safe to
			// assume type is a 'resume', so we execute the callback at the end
			// of the queue so that Meteor.startup can complete before any
			// embedded onLogin callbacks would execute.
			Meteor.setTimeout(() => callback({ type: 'resume' }), 0);
		}
	}

	///
	/// LOGIN TOKENS
	///

	// These methods deal with storing a login token and user id in the
	// browser's localStorage facility. It polls local storage every few
	// seconds to synchronize login state between multiple tabs in the same
	// browser.

	loginWithToken(token, callback) {
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

	///
	/// STORING
	///

	// Call this from the top level of the test file for any test that does
	// logging in and out, to protect multiple tabs running the same tests
	// simultaneously from interfering with each others' localStorage.
	_isolateLoginTokenForTest() {
		this.LOGIN_TOKEN_KEY = this.LOGIN_TOKEN_KEY + Random.id();
		this.USER_ID_KEY = this.USER_ID_KEY + Random.id();
	}

	_storeLoginToken(userId, token, tokenExpires) {
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

	///
	/// AUTO-LOGIN
	///

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

		let token;
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
		if (this._lastLoginTokenWhenPolled != currentLoginToken) {
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

	///
	/// URLS
	///

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
	 * [`Accounts.sendResetPasswordEmail`](#accounts_sendresetpasswordemail).
	 * This function should be called in top-level code, not inside
	 * `Meteor.startup()`.
	 * @memberof! Accounts
	 * @name onResetPasswordLink
	 * @param  {Function} callback The function to call. It is given two arguments:
	 *
	 * 1. `token`: A password reset token that can be passed to
	 * [`Accounts.resetPassword`](#accounts_resetpassword).
	 * 2. `done`: A function to call when the password reset UI flow is complete. The normal
	 * login process is suspended until this function is called, so that the
	 * password for user A can be reset even if user B was logged in.
	 * @locus Client
	 */
	onResetPasswordLink(callback) {
		if (this._accountsCallbacks['reset-password']) {
			Meteor._debug('Accounts.onResetPasswordLink was called more than once. ' + 'Only one callback added will be executed.');
		}

		this._accountsCallbacks['reset-password'] = callback;
	}

	/**
	 * @summary Register a function to call when an email verification link is
	 * clicked in an email sent by
	 * [`Accounts.sendVerificationEmail`](#accounts_sendverificationemail).
	 * This function should be called in top-level code, not inside
	 * `Meteor.startup()`.
	 * @memberof! Accounts
	 * @name onEmailVerificationLink
	 * @param  {Function} callback The function to call. It is given two arguments:
	 *
	 * 1. `token`: An email verification token that can be passed to
	 * [`Accounts.verifyEmail`](#accounts_verifyemail).
	 * 2. `done`: A function to call when the email verification UI flow is complete.
	 * The normal login process is suspended until this function is called, so
	 * that the user can be notified that they are verifying their email before
	 * being logged in.
	 * @locus Client
	 */
	onEmailVerificationLink(callback) {
		if (this._accountsCallbacks['verify-email']) {
			Meteor._debug('Accounts.onEmailVerificationLink was called more than once. ' + 'Only one callback added will be executed.');
		}

		this._accountsCallbacks['verify-email'] = callback;
	}

	/**
	 * @summary Register a function to call when an account enrollment link is
	 * clicked in an email sent by
	 * [`Accounts.sendEnrollmentEmail`](#accounts_sendenrollmentemail).
	 * This function should be called in top-level code, not inside
	 * `Meteor.startup()`.
	 * @memberof! Accounts
	 * @name onEnrollmentLink
	 * @param  {Function} callback The function to call. It is given two arguments:
	 *
	 * 1. `token`: A password reset token that can be passed to
	 * [`Accounts.resetPassword`](#accounts_resetpassword) to give the newly
	 * enrolled account a password.
	 * 2. `done`: A function to call when the enrollment UI flow is complete.
	 * The normal login process is suspended until this function is called, so that
	 * user A can be enrolled even if user B was logged in.
	 * @locus Client
	 */
	onEnrollmentLink(callback) {
		if (this._accountsCallbacks['enroll-account']) {
			Meteor._debug('Accounts.onEnrollmentLink was called more than once. ' + 'Only one callback added will be executed.');
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
Meteor.logout = (callback) => Accounts.logout(callback);

/**
 * @summary Log out other clients logged in as the current user, but does not log out the client that calls this function.
 * @locus Client
 * @param {Function} [callback] Optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
 * @importFromPackage meteor
 */
Meteor.logoutOtherClients = (callback) => Accounts.logoutOtherClients(callback);

/**
 * @summary Login with a Meteor access token.
 * @locus Client
 * @param {Object} [token] Local storage token for use with login across
 * multiple tabs in the same browser.
 * @param {Function} [callback] Optional callback. Called with no arguments on
 * success.
 * @importFromPackage meteor
 */
Meteor.loginWithToken = (token, callback) => Accounts.loginWithToken(token, callback);

///
/// HANDLEBARS HELPERS
///

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

const defaultSuccessHandler = function (token, urlPart) {
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
const attemptToMatchHash = (accounts, hash, success) => {
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
	attemptToMatchHash: (hash, success) => attemptToMatchHash(Accounts, hash, success),
};
