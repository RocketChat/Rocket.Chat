import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { DDPCommon } from 'meteor/ddp-common';
import { DDP } from 'meteor/ddp';
import { Accounts } from 'meteor/accounts-base';
import { Restivus } from 'meteor/nimble:restivus';
import { RateLimiter } from 'meteor/rate-limit';
import _ from 'underscore';

import { Logger } from '../../app/logger';
import { settings } from '../../app/settings';
import { metrics } from '../metrics';
import { hasPermission, hasAllPermission } from '../../app/authorization';
import { getDefaultUserFields } from '../../app/utils/server/functions/getDefaultUserFields';
import { checkCodeForUser } from '../../app/2fa/server/code';


const logger = new Logger('API', {});
const rateLimiterDictionary = {};
export const defaultRateLimiterOptions = {
	numRequestsAllowed: settings.get('API_Enable_Rate_Limiter_Limit_Calls_Default'),
	intervalTimeInMS: settings.get('API_Enable_Rate_Limiter_Limit_Time_Default'),
};
let prometheusAPIUserAgent = false;

export let API = {};

const getRequestIP = (req) =>
	req.headers['x-forwarded-for']
	|| (req.connection && req.connection.remoteAddress)
	|| (req.socket && req.socket.remoteAddress)
	|| (req.connection && req.connection.socket && req.connection.socket.remoteAddress);

export class APIClass extends Restivus {
	constructor(properties) {
		super(properties);
		this.apiPath = properties.apiPath;
		this.authMethods = [];
		this.fieldSeparator = '.';
		this.defaultFieldsToExclude = {
			joinCode: 0,
			members: 0,
			importIds: 0,
			e2e: 0,
		};
		this.defaultLimitedUserFieldsToExclude = {
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
			settings: 0,
		};
		this.limitedUserFieldsToExclude = this.defaultLimitedUserFieldsToExclude;
		this.limitedUserFieldsToExcludeIfIsPrivilegedUser = {
			services: 0,
		};
	}

	setLimitedCustomFields(customFields) {
		const nonPublicFieds = customFields.reduce((acc, customField) => {
			acc[`customFields.${ customField }`] = 0;
			return acc;
		}, {});
		this.limitedUserFieldsToExclude = {
			...this.defaultLimitedUserFieldsToExclude,
			...nonPublicFieds,
		};
	}

	hasHelperMethods() {
		return API.helperMethods.size !== 0;
	}

	getHelperMethods() {
		return API.helperMethods;
	}

	getHelperMethod(name) {
		return API.helperMethods.get(name);
	}

	addAuthMethod(method) {
		this.authMethods.push(method);
	}

	shouldAddRateLimitToRoute(options) {
		const { version } = this._config;
		const { rateLimiterOptions } = options;
		return (typeof rateLimiterOptions === 'object' || rateLimiterOptions === undefined) && Boolean(version) && !process.env.TEST_MODE && Boolean(defaultRateLimiterOptions.numRequestsAllowed && defaultRateLimiterOptions.intervalTimeInMS);
	}

	success(result = {}) {
		if (_.isObject(result)) {
			result.success = true;
		}

		result = {
			statusCode: 200,
			body: result,
		};

		logger.debug('Success', result);

		return result;
	}

	failure(result, errorType, stack, error) {
		if (_.isObject(result)) {
			result.success = false;
		} else {
			result = {
				success: false,
				error: result,
				stack,
			};

			if (errorType) {
				result.errorType = errorType;
			}

			if (error && error.details) {
				try {
					result.details = JSON.parse(error.details);
				} catch (e) {
					result.details = error.details;
				}
			}
		}

		result = {
			statusCode: 400,
			body: result,
		};

		logger.debug('Failure', result);

		return result;
	}

	notFound(msg) {
		return {
			statusCode: 404,
			body: {
				success: false,
				error: msg || 'Resource not found',
			},
		};
	}

	internalError(msg) {
		return {
			statusCode: 500,
			body: {
				success: false,
				error: msg || 'Internal error occured',
			},
		};
	}

	unauthorized(msg) {
		return {
			statusCode: 403,
			body: {
				success: false,
				error: msg || 'unauthorized',
			},
		};
	}

	tooManyRequests(msg) {
		return {
			statusCode: 429,
			body: {
				success: false,
				error: msg || 'Too many requests',
			},
		};
	}

	getRateLimiter(route) {
		return rateLimiterDictionary[route];
	}

	shouldVerifyRateLimit(route, userId) {
		return rateLimiterDictionary.hasOwnProperty(route)
			&& settings.get('API_Enable_Rate_Limiter') === true
			&& (process.env.NODE_ENV !== 'development' || settings.get('API_Enable_Rate_Limiter_Dev') === true)
			&& !(userId && hasPermission(userId, 'api-bypass-rate-limit'));
	}

	enforceRateLimit(objectForRateLimitMatch, request, response, userId) {
		if (!this.shouldVerifyRateLimit(objectForRateLimitMatch.route, userId)) {
			return;
		}

		rateLimiterDictionary[objectForRateLimitMatch.route].rateLimiter.increment(objectForRateLimitMatch);
		const attemptResult = rateLimiterDictionary[objectForRateLimitMatch.route].rateLimiter.check(objectForRateLimitMatch);
		const timeToResetAttempsInSeconds = Math.ceil(attemptResult.timeToReset / 1000);
		response.setHeader('X-RateLimit-Limit', rateLimiterDictionary[objectForRateLimitMatch.route].options.numRequestsAllowed);
		response.setHeader('X-RateLimit-Remaining', attemptResult.numInvocationsLeft);
		response.setHeader('X-RateLimit-Reset', new Date().getTime() + attemptResult.timeToReset);

		if (!attemptResult.allowed) {
			throw new Meteor.Error('error-too-many-requests', `Error, too many requests. Please slow down. You must wait ${ timeToResetAttempsInSeconds } seconds before trying this endpoint again.`, {
				timeToReset: attemptResult.timeToReset,
				seconds: timeToResetAttempsInSeconds,
			});
		}
	}

	reloadRoutesToRefreshRateLimiter() {
		const { version } = this._config;
		this._routes.forEach((route) => {
			if (this.shouldAddRateLimitToRoute(route.options)) {
				this.addRateLimiterRuleForRoutes({
					routes: [route.path],
					rateLimiterOptions: route.options.rateLimiterOptions || defaultRateLimiterOptions,
					endpoints: Object.keys(route.endpoints).filter((endpoint) => endpoint !== 'options'),
					apiVersion: version,
				});
			}
		});
	}

	addRateLimiterRuleForRoutes({ routes, rateLimiterOptions, endpoints, apiVersion }) {
		if (!rateLimiterOptions.numRequestsAllowed) {
			throw new Meteor.Error('You must set "numRequestsAllowed" property in rateLimiter for REST API endpoint');
		}
		if (!rateLimiterOptions.intervalTimeInMS) {
			throw new Meteor.Error('You must set "intervalTimeInMS" property in rateLimiter for REST API endpoint');
		}
		const addRateLimitRuleToEveryRoute = (routes) => {
			routes.forEach((route) => {
				rateLimiterDictionary[route] = {
					rateLimiter: new RateLimiter(),
					options: rateLimiterOptions,
				};
				const rateLimitRule = {
					IPAddr: (input) => input,
					route,
				};
				rateLimiterDictionary[route].rateLimiter.addRule(rateLimitRule, rateLimiterOptions.numRequestsAllowed, rateLimiterOptions.intervalTimeInMS);
			});
		};
		routes
			.map((route) => this.namedRoutes(route, endpoints, apiVersion))
			.map(addRateLimitRuleToEveryRoute);
	}

	processTwoFactor({ userId, request, invocation, options, connection }) {
		const code = request.headers['x-2fa-code'];
		const method = request.headers['x-2fa-method'];

		checkCodeForUser({ user: userId, code, method, options, connection });

		invocation.twoFactorChecked = true;
	}

	getFullRouteName(route, method, apiVersion = null) {
		let prefix = `/${ this.apiPath || '' }`;
		if (apiVersion) {
			prefix += `${ apiVersion }/`;
		}
		return `${ prefix }${ route }${ method }`;
	}

	namedRoutes(route, endpoints, apiVersion) {
		const routeActions = Array.isArray(endpoints) ? endpoints : Object.keys(endpoints);

		return routeActions.map((action) => this.getFullRouteName(route, action, apiVersion));
	}

	addRoute(routes, options, endpoints) {
		// Note: required if the developer didn't provide options
		if (typeof endpoints === 'undefined') {
			endpoints = options;
			options = {};
		}

		let shouldVerifyPermissions;

		if (!_.isArray(options.permissionsRequired)) {
			options.permissionsRequired = undefined;
			shouldVerifyPermissions = false;
		} else {
			shouldVerifyPermissions = !!options.permissionsRequired.length;
		}


		// Allow for more than one route using the same option and endpoints
		if (!_.isArray(routes)) {
			routes = [routes];
		}
		const { version } = this._config;
		if (this.shouldAddRateLimitToRoute(options)) {
			this.addRateLimiterRuleForRoutes({
				routes,
				rateLimiterOptions: options.rateLimiterOptions || defaultRateLimiterOptions,
				endpoints,
				apiVersion: version,
			});
		}
		routes.forEach((route) => {
			// Note: This is required due to Restivus calling `addRoute` in the constructor of itself
			Object.keys(endpoints).forEach((method) => {
				if (typeof endpoints[method] === 'function') {
					endpoints[method] = { action: endpoints[method] };
				}
				// Add a try/catch for each endpoint
				const originalAction = endpoints[method].action;
				const api = this;
				endpoints[method].action = function _internalRouteActionHandler() {
					const rocketchatRestApiEnd = metrics.rocketchatRestApi.startTimer({
						method,
						version,
						...prometheusAPIUserAgent && { user_agent: this.request.headers['user-agent'] },
						entrypoint: route.startsWith('method.call') ? decodeURIComponent(this.request._parsedUrl.pathname.slice(8)) : route,
					});

					logger.debug(`${ this.request.method.toUpperCase() }: ${ this.request.url }`);
					this.requestIp = getRequestIP(this.request);
					const objectForRateLimitMatch = {
						IPAddr: this.requestIp,
						route: `${ this.request.route }${ this.request.method.toLowerCase() }`,
					};
					let result;

					const connection = {
						id: Random.id(),
						close() {},
						token: this.token,
						httpHeaders: this.request.headers,
						clientAddress: this.requestIp,
					};

					try {
						api.enforceRateLimit(objectForRateLimitMatch, this.request, this.response, this.userId);

						if (shouldVerifyPermissions && (!this.userId || !hasAllPermission(this.userId, options.permissionsRequired))) {
							throw new Meteor.Error('error-unauthorized', 'User does not have the permissions required for this action', {
								permissions: options.permissionsRequired,
							});
						}

						const invocation = new DDPCommon.MethodInvocation({
							connection,
							isSimulation: false,
							userId: this.userId,
						});

						Accounts._accountData[connection.id] = {
							connection,
						};
						Accounts._setAccountData(connection.id, 'loginToken', this.token);

						if (options.twoFactorRequired) {
							api.processTwoFactor({ userId: this.userId, request: this.request, invocation, options: options.twoFactorOptions, connection });
						}

						result = DDP._CurrentInvocation.withValue(invocation, () => originalAction.apply(this));
					} catch (e) {
						logger.debug(`${ method } ${ route } threw an error:`, e.stack);

						const apiMethod = {
							'error-too-many-requests': 'tooManyRequests',
							'error-unauthorized': 'unauthorized',
						}[e.error] || 'failure';

						result = API.v1[apiMethod](typeof e === 'string' ? e : e.message, e.error, process.env.TEST_MODE ? e.stack : undefined, e);
					} finally {
						delete Accounts._accountData[connection.id];
					}

					result = result || API.v1.success();

					rocketchatRestApiEnd({
						status: result.statusCode,
					});

					return result;
				};

				if (this.hasHelperMethods()) {
					for (const [name, helperMethod] of this.getHelperMethods()) {
						endpoints[method][name] = helperMethod;
					}
				}

				// Allow the endpoints to make usage of the logger which respects the user's settings
				endpoints[method].logger = logger;
			});

			super.addRoute(route, options, endpoints);
		});
	}

	_initAuth() {
		const loginCompatibility = (bodyParams, request) => {
			// Grab the username or email that the user is logging in with
			const { user, username, email, password, code: bodyCode } = bodyParams;

			if (password == null) {
				return bodyParams;
			}

			if (_.without(Object.keys(bodyParams), 'user', 'username', 'email', 'password', 'code').length > 0) {
				return bodyParams;
			}

			const code = bodyCode || request.headers['x-2fa-code'];

			const auth = {
				password,
			};

			if (typeof user === 'string') {
				auth.user = user.includes('@') ? { email: user } : { username: user };
			} else if (username) {
				auth.user = { username };
			} else if (email) {
				auth.user = { email };
			}

			if (auth.user == null) {
				return bodyParams;
			}

			if (auth.password.hashed) {
				auth.password = {
					digest: auth.password,
					algorithm: 'sha-256',
				};
			}

			if (code) {
				return {
					totp: {
						code,
						login: auth,
					},
				};
			}

			return auth;
		};

		const self = this;

		this.addRoute('login', { authRequired: false }, {
			post() {
				const args = loginCompatibility(this.bodyParams, this.request);
				const getUserInfo = self.getHelperMethod('getUserInfo');

				const invocation = new DDPCommon.MethodInvocation({
					connection: {
						close() {},
					},
				});

				let auth;
				try {
					auth = DDP._CurrentInvocation.withValue(invocation, () => Meteor.call('login', args));
				} catch (error) {
					let e = error;
					if (error.reason === 'User not found') {
						e = {
							error: 'Unauthorized',
							reason: 'Unauthorized',
						};
					}

					return {
						statusCode: 401,
						body: {
							status: 'error',
							error: e.error,
							details: e.details,
							message: e.reason || e.message,
						},
					};
				}

				this.user = Meteor.users.findOne({
					_id: auth.id,
				}, {
					fields: getDefaultUserFields(),
				});

				this.userId = this.user._id;

				const response = {
					status: 'success',
					data: {
						userId: this.userId,
						authToken: auth.token,
						me: getUserInfo(this.user),
					},
				};

				const extraData = self._config.onLoggedIn && self._config.onLoggedIn.call(this);

				if (extraData != null) {
					_.extend(response.data, {
						extra: extraData,
					});
				}

				return response;
			},
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
				$pull: tokenRemovalQuery,
			});

			const response = {
				status: 'success',
				data: {
					message: 'You\'ve been logged out!',
				},
			};

			// Call the logout hook with the authenticated user attached
			const extraData = self._config.onLoggedOut && self._config.onLoggedOut.call(this);
			if (extraData != null) {
				_.extend(response.data, {
					extra: extraData,
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
			authRequired: true,
		}, {
			get() {
				console.warn('Warning: Default logout via GET will be removed in Restivus v1.0. Use POST instead.');
				console.warn('    See https://github.com/kahmali/meteor-restivus/issues/100');
				return logout.call(this);
			},
			post: logout,
		});
	}
}

const getUserAuth = function _getUserAuth(...args) {
	const invalidResults = [undefined, null, false];
	return {
		token: 'services.resume.loginTokens.hashedToken',
		user() {
			if (this.bodyParams && this.bodyParams.payload) {
				this.bodyParams = JSON.parse(this.bodyParams.payload);
			}

			for (let i = 0; i < API.v1.authMethods.length; i++) {
				const method = API.v1.authMethods[i];

				if (typeof method === 'function') {
					const result = method.apply(this, args);
					if (!invalidResults.includes(result)) {
						return result;
					}
				}
			}

			let token;
			if (this.request.headers['x-auth-token']) {
				token = Accounts._hashLoginToken(this.request.headers['x-auth-token']);
			}

			this.token = token;

			return {
				userId: this.request.headers['x-user-id'],
				token,
			};
		},
	};
};

API = {
	helperMethods: new Map(),
	getUserAuth,
	ApiClass: APIClass,
};

const defaultOptionsEndpoint = function _defaultOptionsEndpoint() {
	if (this.request.method === 'OPTIONS' && this.request.headers['access-control-request-method']) {
		if (settings.get('API_Enable_CORS') === true) {
			this.response.writeHead(200, {
				'Access-Control-Allow-Origin': settings.get('API_CORS_Origin'),
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, HEAD, PATCH',
				'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, X-User-Id, X-Auth-Token, x-visitor-token',
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

const createApi = function _createApi(_api, options = {}) {
	_api = _api || new APIClass(Object.assign({
		apiPath: 'api/',
		useDefaultAuth: true,
		prettyJson: process.env.NODE_ENV === 'development',
		defaultOptionsEndpoint,
		auth: getUserAuth(),
	}, options));

	delete _api._config.defaultHeaders['Access-Control-Allow-Origin'];
	delete _api._config.defaultHeaders['Access-Control-Allow-Headers'];
	delete _api._config.defaultHeaders.Vary;

	if (settings.get('API_Enable_CORS')) {
		const origin = settings.get('API_CORS_Origin');

		if (origin) {
			_api._config.defaultHeaders['Access-Control-Allow-Origin'] = origin;

			if (origin !== '*') {
				_api._config.defaultHeaders.Vary = 'Origin';
			}
		}

		_api._config.defaultHeaders['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, X-User-Id, X-Auth-Token';
	}

	return _api;
};

const createApis = function _createApis() {
	API.v1 = createApi(API.v1, {
		version: 'v1',
	});

	API.default = createApi(API.default);
};

// also create the API immediately
createApis();

// register the API to be re-created once the CORS-setting changes.
settings.get(/^(API_Enable_CORS|API_CORS_Origin)$/, () => {
	createApis();
});

settings.get('Accounts_CustomFields', (key, value) => {
	if (!value) {
		return API.v1.setLimitedCustomFields([]);
	}
	try {
		const customFields = JSON.parse(value);
		const nonPublicCustomFields = Object.keys(customFields).filter((customFieldKey) => customFields[customFieldKey].public !== true);
		API.v1.setLimitedCustomFields(nonPublicCustomFields);
	} catch (error) {
		console.warn('Invalid Custom Fields', error);
	}
});

settings.get('API_Enable_Rate_Limiter_Limit_Time_Default', (key, value) => {
	defaultRateLimiterOptions.intervalTimeInMS = value;
	API.v1.reloadRoutesToRefreshRateLimiter();
});

settings.get('API_Enable_Rate_Limiter_Limit_Calls_Default', (key, value) => {
	defaultRateLimiterOptions.numRequestsAllowed = value;
	API.v1.reloadRoutesToRefreshRateLimiter();
});

settings.get('Prometheus_API_User_Agent', (key, value) => {
	prometheusAPIUserAgent = value;
});
