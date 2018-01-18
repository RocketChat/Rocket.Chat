/* global Restivus, DDP, DDPCommon */
import _ from 'underscore';

class API extends Restivus {
	constructor(properties) {
		super(properties);
		this.logger = new Logger(`API ${ properties.version ? properties.version : 'default' } Logger`, {});
		this.authMethods = [];
		this.fieldSeparator = '.';
		this.defaultFieldsToExclude = {
			joinCode: 0,
			$loki: 0,
			meta: 0,
			members: 0,
			usernames: 0, // Please use the `channel/dm/group.members` endpoint. This is disabled for performance reasons
			importIds: 0
		};
		this.limitedUserFieldsToExclude = {
			avatarOrigin: 0,
			emails: 0,
			phone: 0,
			statusConnection: 0,
			createdAt: 0,
			lastLogin: 0,
			services: 0,
			requirePasswordChange: 0,
			requirePasswordChangeReason: 0,
			roles: 0,
			statusDefault: 0,
			_updatedAt: 0,
			customFields: 0
		};

		this._config.defaultOptionsEndpoint = function _defaultOptionsEndpoint() {
			if (this.request.method === 'OPTIONS' && this.request.headers['access-control-request-method']) {
				if (RocketChat.settings.get('API_Enable_CORS') === true) {
					this.response.writeHead(200, {
						'Access-Control-Allow-Origin': RocketChat.settings.get('API_CORS_Origin'),
						'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, X-User-Id, X-Auth-Token'
					});
				} else {
					this.response.writeHead(405);
					this.response.write('CORS not enabled. Go to "Admin > General > REST Api" to enable it.');
				}
			} else {
				this.response.writeHead(404);
			}

			this.done();
		};
	}

	addAuthMethod(method) {
		this.authMethods.push(method);
	}

	success(result = {}) {
		if (_.isObject(result)) {
			result.success = true;
		}

		return {
			statusCode: 200,
			body: result
		};
	}

	failure(result, errorType) {
		if (_.isObject(result)) {
			result.success = false;
		} else {
			result = {
				success: false,
				error: result
			};

			if (errorType) {
				result.errorType = errorType;
			}
		}

		return {
			statusCode: 400,
			body: result
		};
	}

	notFound(msg) {
		return {
			statusCode: 404,
			body: {
				success: false,
				error: msg ? msg : 'Resource not found'
			}
		};
	}

	unauthorized(msg) {
		return {
			statusCode: 403,
			body: {
				success: false,
				error: msg ? msg : 'unauthorized'
			}
		};
	}

	addRoute(routes, options, endpoints) {
		//Note: required if the developer didn't provide options
		if (typeof endpoints === 'undefined') {
			endpoints = options;
			options = {};
		}

		//Allow for more than one route using the same option and endpoints
		if (!_.isArray(routes)) {
			routes = [routes];
		}

		routes.forEach((route) => {
			//Note: This is required due to Restivus calling `addRoute` in the constructor of itself
			if (RocketChat.API.helperMethods) {
				Object.keys(endpoints).forEach((method) => {
					if (typeof endpoints[method] === 'function') {
						endpoints[method] = {action: endpoints[method]};
					}

					//Add a try/catch for each endpoint
					const originalAction = endpoints[method].action;
					endpoints[method].action = function _internalRouteActionHandler() {
						this.logger.debug(`${ this.request.method.toUpperCase() }: ${ this.request.url }`);
						let result;
						try {
							result = originalAction.apply(this);
						} catch (e) {
							this.logger.debug(`${ method } ${ route } threw an error:`, e.stack);
							return RocketChat.API.v1.failure(e.message, e.error);
						}

						result = result ? result : RocketChat.API.v1.success();

						if (
							/(channels|groups)\./.test(route)
							&& result
							&& result.body
							&& result.body.success === true
							&& (result.body.channel || result.body.channels || result.body.group || result.body.groups)
						) {
							// TODO: Remove this after three versions have been released. That means at 0.64 this should be gone. ;)
							result.body.developerWarning = '[WARNING]: The "usernames" field has been removed for performance reasons. Please use the "*.members" endpoint to get a list of members/users in a room.';
						}

						return result;
					};

					for (const [name, helperMethod] of RocketChat.API.helperMethods) {
						endpoints[method][name] = helperMethod;
					}

					//Allow the endpoints to make usage of the logger which respects the user's settings
					endpoints[method].logger = this.logger;
				});
			}

			super.addRoute(route, options, endpoints);
		});
	}

	_initAuth() {
		const loginCompatibility = (bodyParams) => {
			// Grab the username or email that the user is logging in with
			const {user, username, email, password, code} = bodyParams;

			if (password == null) {
				return bodyParams;
			}

			if (_.without(Object.keys(bodyParams), 'user', 'username', 'email', 'password', 'code').length > 0) {
				return bodyParams;
			}

			const auth = {
				password
			};

			if (typeof user === 'string') {
				auth.user = user.includes('@') ? {email: user} : {username: user};
			} else if (username) {
				auth.user = {username};
			} else if (email) {
				auth.user = {email};
			}

			if (auth.user == null) {
				return bodyParams;
			}

			if (auth.password.hashed) {
				auth.password = {
					digest: auth.password,
					algorithm: 'sha-256'
				};
			}

			if (code) {
				return {
					totp: {
						code,
						login: auth
					}
				};
			}

			return auth;
		};

		const self = this;

		this.addRoute('login', {authRequired: false}, {
			post() {
				const args = loginCompatibility(this.bodyParams);

				const invocation = new DDPCommon.MethodInvocation({
					connection: {
						close() {}
					}
				});

				let auth;
				try {
					auth = DDP._CurrentInvocation.withValue(invocation, () => Meteor.call('login', args));
				} catch (error) {
					let e = error;
					if (error.reason === 'User not found') {
						e = {
							error: 'Unauthorized',
							reason: 'Unauthorized'
						};
					}

					return {
						statusCode: 401,
						body: {
							status: 'error',
							error: e.error,
							message: e.reason || e.message
						}
					};
				}

				this.user = Meteor.users.findOne({
					_id: auth.id
				});

				this.userId = this.user._id;

				// Remove tokenExpires to keep the old behavior
				Meteor.users.update({
					_id: this.user._id,
					'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(auth.token)
				}, {
					$unset: {
						'services.resume.loginTokens.$.when': 1
					}
				});

				const response = {
					status: 'success',
					data: {
						userId: this.userId,
						authToken: auth.token
					}
				};

				const extraData = self._config.onLoggedIn && self._config.onLoggedIn.call(this);

				if (extraData != null) {
					_.extend(response.data, {
						extra: extraData
					});
				}

				return response;
			}
		});

		const logout = function() {
			// Remove the given auth token from the user's account
			const authToken = this.request.headers['x-auth-token'];
			const hashedToken = Accounts._hashLoginToken(authToken);
			const tokenLocation = self._config.auth.token;
			const index = tokenLocation.lastIndexOf('.');
			const tokenPath = tokenLocation.substring(0, index);
			const tokenFieldName = tokenLocation.substring(index + 1);
			const tokenToRemove = {};
			tokenToRemove[tokenFieldName] = hashedToken;
			const tokenRemovalQuery = {};
			tokenRemovalQuery[tokenPath] = tokenToRemove;

			Meteor.users.update(this.user._id, {
				$pull: tokenRemovalQuery
			});

			const response = {
				status: 'success',
				data: {
					message: 'You\'ve been logged out!'
				}
			};

			// Call the logout hook with the authenticated user attached
			const extraData = self._config.onLoggedOut && self._config.onLoggedOut.call(this);
			if (extraData != null) {
				_.extend(response.data, {
					extra: extraData
				});
			}
			return response;
		};

		/*
		Add a logout endpoint to the API
		After the user is logged out, the onLoggedOut hook is called (see Restfully.configure() for
		adding hook).
		*/
		return this.addRoute('logout', {
			authRequired: true
		}, {
			get() {
				console.warn('Warning: Default logout via GET will be removed in Restivus v1.0. Use POST instead.');
				console.warn('    See https://github.com/kahmali/meteor-restivus/issues/100');
				return logout.call(this);
			},
			post: logout
		});
	}
}

const getUserAuth = function _getUserAuth() {
	const invalidResults = [undefined, null, false];
	return {
		token: 'services.resume.loginTokens.hashedToken',
		user() {
			if (this.bodyParams && this.bodyParams.payload) {
				this.bodyParams = JSON.parse(this.bodyParams.payload);
			}

			for (let i = 0; i < RocketChat.API.v1.authMethods.length; i++) {
				const method = RocketChat.API.v1.authMethods[i];

				if (typeof method === 'function') {
					const result = method.apply(this, arguments);
					if (!invalidResults.includes(result)) {
						return result;
					}
				}
			}

			let token;
			if (this.request.headers['x-auth-token']) {
				token = Accounts._hashLoginToken(this.request.headers['x-auth-token']);
			}

			return {
				userId: this.request.headers['x-user-id'],
				token
			};
		}
	};
};

RocketChat.API = {
	helperMethods: new Map(),
	getUserAuth,
	ApiClass: API
};

const createApi = function _createApi(enableCors) {
	if (!RocketChat.API.v1 || RocketChat.API.v1._config.enableCors !== enableCors) {
		RocketChat.API.v1 = new API({
			version: 'v1',
			useDefaultAuth: true,
			prettyJson: process.env.NODE_ENV === 'development',
			enableCors,
			auth: getUserAuth()
		});
	}

	if (!RocketChat.API.default || RocketChat.API.default._config.enableCors !== enableCors) {
		RocketChat.API.default = new API({
			useDefaultAuth: true,
			prettyJson: process.env.NODE_ENV === 'development',
			enableCors,
			auth: getUserAuth()
		});
	}
};

// register the API to be re-created once the CORS-setting changes.
RocketChat.settings.get('API_Enable_CORS', (key, value) => {
	createApi(value);
});

// also create the API immediately
createApi(!!RocketChat.settings.get('API_Enable_CORS'));
