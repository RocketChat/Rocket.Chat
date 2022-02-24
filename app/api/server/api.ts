/* eslint-disable @typescript-eslint/camelcase */
import { Server, ServerResponse } from 'http';

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { DDPCommon } from 'meteor/ddp-common';
import { DDP } from 'meteor/ddp';
import { Accounts } from 'meteor/accounts-base';
import _ from 'underscore';
import { IncomingMessage } from 'connect';
import { Route, RouteOptions } from 'meteor/kadira:flow-router';
import { IHttpRequest } from '@rocket.chat/apps-engine/definition/accessors';

import { ITwoFactorOptions, checkCodeForUser } from '../../2fa/server/code';
import { IMethodConnection } from '../../../definition/IMethodThisType';
import type { IUser } from '../../../definition/IUser';
import type { JoinPathPattern, Method, MethodOf, OperationParams, OperationResult, PathPattern, UrlParams } from '../../../definition/rest';
import { Logger } from '../../../server/lib/logger/Logger';
import { getRestPayload } from '../../../server/lib/logger/logPayloads';
import { settings } from '../../settings/server';
import { metrics } from '../../metrics/server';
import { hasPermission, hasAllPermission } from '../../authorization/server';
import { getDefaultUserFields } from '../../utils/server/functions/getDefaultUserFields';
import { RateLimiter } from '../../lib/server';
import { MethodInvocation } from '../../2fa/server/MethodInvocationOverride';
import { SettingValue } from '../../../definition/ISetting';

const logger = new Logger('API');

const rateLimiterDictionary = {} as typeof RateLimiter;

export const defaultRateLimiterOptions = {
	numRequestsAllowed: settings.get('API_Enable_Rate_Limiter_Limit_Calls_Default'),
	intervalTimeInMS: settings.get('API_Enable_Rate_Limiter_Limit_Time_Default'),
};
let prometheusAPIUserAgent = false;

// export let API = {};

export declare const API: {
	v1: APIClass<'/v1'>;
	default: APIClass;
};

type SuccessResult<T> = {
	statusCode: 200;
	body: T extends object ? { success: true } & T : T;
};

type FailureResult<T, TStack = undefined, TErrorType = undefined, TErrorDetails = undefined> = {
	statusCode: 400;
	body: T extends object
		? { success: false } & T
		: {
				success: false;
				error: T;
				stack: TStack;
				errorType: TErrorType;
				details: TErrorDetails;
		  } & (undefined extends TErrorType ? {} : { errorType: TErrorType }) &
				(undefined extends TErrorDetails ? {} : { details: TErrorDetails extends string ? unknown : TErrorDetails });
};

type UnauthorizedResult<T> = {
	statusCode: 403;
	body: {
		success: false;
		error: T | 'unauthorized';
	};
};

type Options = {
	permissionsRequired?: string[];
	authRequired?: boolean;
	forceTwoFactorAuthenticationForNonEnterprise?: boolean;

	twoFactorRequired: boolean;
	twoFactorOptions?: ITwoFactorOptions;
};

export type NonEnterpriseTwoFactorOptions = {
	authRequired: true;
	forceTwoFactorAuthenticationForNonEnterprise: true;
	twoFactorRequired: true;
	permissionsRequired?: string[];
	twoFactorOptions: ITwoFactorOptions;
};

type Request = {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE';
	url: string;
	headers: Record<string, string>;
	body: unknown;
};

type ActionThis<TMethod extends Method, TPathPattern extends PathPattern, TOptions> = {
	urlParams: UrlParams<TPathPattern>;
	// TODO make it unsafe
	queryParams: TMethod extends 'GET' ? Partial<OperationParams<TMethod, TPathPattern>> : Record<string, string>;
	// TODO make it unsafe
	bodyParams: TMethod extends 'GET' ? Record<string, unknown> : Partial<OperationParams<TMethod, TPathPattern>>;
	request: Request;
	requestParams(): OperationParams<TMethod, TPathPattern>;
	getPaginationItems(): {
		offset: number;
		count: number;
	};
	parseJsonQuery(): {
		sort: Record<string, unknown>;
		fields: Record<string, unknown>;
		query: Record<string, unknown>;
	};
	getUserFromParams(): IUser;
} & (TOptions extends { authRequired: true }
	? {
			user: IUser;
			userId: string;
	  }
	: {
			user: null;
			userId: null;
	  });

export type ResultFor<TMethod extends Method, TPathPattern extends PathPattern> =
	| SuccessResult<OperationResult<TMethod, TPathPattern>>
	| FailureResult<unknown, unknown, unknown, unknown>
	| UnauthorizedResult<unknown>;

type Action<TMethod extends Method, TPathPattern extends PathPattern, TOptions> =
	| ((this: ActionThis<TMethod, TPathPattern, TOptions>) => Promise<ResultFor<TMethod, TPathPattern>>)
	| ((this: ActionThis<TMethod, TPathPattern, TOptions>) => ResultFor<TMethod, TPathPattern>);

type Operation<TMethod extends Method, TPathPattern extends PathPattern, TEndpointOptions> =
	| Action<TMethod, TPathPattern, TEndpointOptions>
	| ({
			action: Action<TMethod, TPathPattern, TEndpointOptions>;
	  } & { twoFactorRequired: boolean });

type Operations<TPathPattern extends PathPattern, TOptions extends Options = {}> = {
	[M in MethodOf<TPathPattern> as Lowercase<M>]: Operation<Uppercase<M>, TPathPattern, TOptions>;
};

const getRequestIP = (req: IncomingMessage): unknown => {
	const socket = req.socket || req.connection;
	const remoteAddress = req.headers['x-real-ip'] || socket?.remoteAddress || req.connection?.remoteAddress || null;
	let forwardedFor = req.headers['x-forwarded-for'];

	if (!socket) {
		return remoteAddress || forwardedFor || null;
	}

	const httpForwardedCount = parseInt(String(process.env.HTTP_FORWARDED_COUNT)) || 0;
	if (httpForwardedCount <= 0) {
		return remoteAddress;
	}

	if (!_.isString(forwardedFor)) {
		return remoteAddress;
	}

	forwardedFor = forwardedFor.trim().split(/\s*,\s*/);
	if (httpForwardedCount > forwardedFor.length) {
		return remoteAddress;
	}

	return forwardedFor[forwardedFor.length - httpForwardedCount];
};

export class APIClass<TBasePath extends string = '/'> {
	/* Class members declarations: */
	apiPath: string;

	authMethods: string[];

	fieldSeparator: string;

	defaultFieldsToExclude: {
		joinCode: number;
		members: number;
		importIds: number;
		e2e: number;
	};

	defaultLimitedUserFieldsToExclude: {
		avatarOrigin: number;
		emails: number;
		phone: number;
		statusConnection: number;
		createdAt: number;
		lastLogin: number;
		services: number;
		requirePasswordChange: number;
		requirePasswordChangeReason: number;
		roles: number;
		statusDefault: number;
		_updatedAt: number;
		settings: number;
	};

	limitedUserFieldsToExclude: unknown;

	limitedUserFieldsToExcludeIfIsPrivilegedUser: {
		services: number;
	};

	_config: {
		version: string;
		onLoggedIn: Server;
	};

	_routes: Route[];

	constructor(properties: {
		apiPath: string;
		useDefaultAuth?: boolean;
		prettyJson?: boolean;
		defaultOptionsEndpoint?: () => void;
		auth?: { token: string; user(): unknown };
	}) {
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

	setLimitedCustomFields(customFields: string[]): void {
		const nonPublicFieds = customFields.reduce((acc: Record<string, number>, customField) => {
			acc[`customFields.${customField}`] = 0;
			return acc;
		}, {});
		this.limitedUserFieldsToExclude = {
			...this.defaultLimitedUserFieldsToExclude,
			...nonPublicFieds,
		};
	}

	hasHelperMethods(): boolean {
		return (API as any).helperMethods.size !== 0;
	}

	getHelperMethods(): string[] {
		return (API as any).helperMethods;
	}

	getHelperMethod(name: string): string[] {
		return (API as any).helperMethods.get(name);
	}

	addAuthMethod(method: string): void {
		this.authMethods.push(method);
	}

	shouldAddRateLimitToRoute(options: Options): boolean {
		const { version } = this._config;

		const rateLimiterOptions = options;

		return (
			(typeof rateLimiterOptions === 'object' || rateLimiterOptions === undefined) &&
			Boolean(version) &&
			!process.env.TEST_MODE &&
			Boolean(defaultRateLimiterOptions.numRequestsAllowed && defaultRateLimiterOptions.intervalTimeInMS)
		);
	}

	success<T>(result: SuccessResult<T>): SuccessResult<T> {
		// The SuccessResult<T> type definition handles the result.body and result.sucess
		return result;
	}

	failure<T, TStack = undefined, TErrorType = undefined, TErrorDetails = undefined>(
		result: FailureResult<T, TStack, TErrorType, TErrorDetails>,
	): FailureResult<T, TStack, TErrorType, TErrorDetails> {
		// The FailureResult<T> type definition handles the body.sucess, error, stack, errorType and error.details
		return result;
	}

	notFound(msg: string): unknown {
		return {
			statusCode: 404,
			body: {
				success: false,
				error: msg || 'Resource not found',
			},
		};
	}

	internalError(msg: string): unknown {
		return {
			statusCode: 500,
			body: {
				success: false,
				error: msg || 'Internal error occured',
			},
		};
	}

	unauthorized(msg: string): unknown {
		return {
			statusCode: 403,
			body: {
				success: false,
				error: msg || 'unauthorized',
			},
		};
	}

	tooManyRequests(msg: string): unknown {
		return {
			statusCode: 429,
			body: {
				success: false,
				error: msg || 'Too many requests',
			},
		};
	}

	getRateLimiter(route: string): unknown {
		return (rateLimiterDictionary as any)[route];
	}

	shouldVerifyRateLimit(route: string, userId: string): boolean {
		return (
			rateLimiterDictionary.hasOwnProperty(route) &&
			settings.get('API_Enable_Rate_Limiter') === true &&
			(process.env.NODE_ENV !== 'development' || settings.get('API_Enable_Rate_Limiter_Dev') === true) &&
			!(userId && hasPermission(userId, 'api-bypass-rate-limit'))
		);
	}

	enforceRateLimit(objectForRateLimitMatch: any, _request: IncomingMessage, response: ServerResponse, userId: string): void {
		if (!this.shouldVerifyRateLimit(objectForRateLimitMatch.route, userId)) {
			return;
		}

		(rateLimiterDictionary as any)[objectForRateLimitMatch.route].rateLimiter.increment(objectForRateLimitMatch);
		const attemptResult = (rateLimiterDictionary as any)[objectForRateLimitMatch.route].rateLimiter.check(objectForRateLimitMatch);
		const timeToResetAttempsInSeconds = Math.ceil(attemptResult.timeToReset / 1000);
		response.setHeader('X-RateLimit-Limit', (rateLimiterDictionary as any)[objectForRateLimitMatch.route].options.numRequestsAllowed);
		response.setHeader('X-RateLimit-Remaining', attemptResult.numInvocationsLeft);
		response.setHeader('X-RateLimit-Reset', new Date().getTime() + attemptResult.timeToReset);

		if (!attemptResult.allowed) {
			throw new Meteor.Error(
				'error-too-many-requests',
				`Error, too many requests. Please slow down. You must wait ${timeToResetAttempsInSeconds} seconds before trying this endpoint again.`,
				{
					timeToReset: attemptResult.timeToReset,
					seconds: timeToResetAttempsInSeconds,
				},
			);
		}
	}

	reloadRoutesToRefreshRateLimiter(): void {
		const { version } = this._config;
		this._routes.forEach((route) => {
			if (this.shouldAddRateLimitToRoute(route.options)) {
				this.addRateLimiterRuleForRoutes({
					routes: [route.path],
					// rateLimiterOptions: route.options || defaultRateLimiterOptions,
					rateLimiterOptions: defaultRateLimiterOptions,
					endpoints: Object.keys(route.endpoints).filter((endpoint) => endpoint !== 'options'),
					apiVersion: version,
				});
			}
		});
	}

	addRateLimiterRuleForRoutes({
		routes,
		rateLimiterOptions,
		endpoints,
		apiVersion,
	}: {
		routes: string[];
		rateLimiterOptions: typeof defaultRateLimiterOptions;
		endpoints: string[];
		apiVersion: string | undefined;
	}): void {
		if (!rateLimiterOptions.numRequestsAllowed) {
			throw new Meteor.Error('You must set "numRequestsAllowed" property in rateLimiter for REST API endpoint');
		}
		if (!rateLimiterOptions.intervalTimeInMS) {
			throw new Meteor.Error('You must set "intervalTimeInMS" property in rateLimiter for REST API endpoint');
		}
		const addRateLimitRuleToEveryRoute = (routes: string[]): void => {
			routes.forEach((route) => {
				(rateLimiterDictionary as any)[route] = {
					rateLimiter: {} as typeof RateLimiter,
					options: rateLimiterOptions,
				};
				const rateLimitRule = {
					IPAddr: (input: unknown): unknown => input,
					route,
				};
				(rateLimiterDictionary as any)[route].rateLimiter.addRule(
					rateLimitRule,
					rateLimiterOptions.numRequestsAllowed,
					rateLimiterOptions.intervalTimeInMS,
				);
			});
		};
		routes.map((route) => this.namedRoutes(route, endpoints, apiVersion as undefined)).map(addRateLimitRuleToEveryRoute);
	}

	processTwoFactor({
		userId,
		request,
		invocation,
		options,
		connection,
	}: {
		userId: string;
		request: Request;
		invocation: { twoFactorChecked: boolean };
		options: Options;
		connection: IMethodConnection;
	}): void {
		if (!options.twoFactorRequired) {
			return;
		}
		const code = request.headers['x-2fa-code'];
		const method = request.headers['x-2fa-method'];

		checkCodeForUser({ user: userId, code, method, options: options.twoFactorOptions, connection });

		invocation.twoFactorChecked = true;
	}

	getFullRouteName(route: string, method: string, apiVersion = null): string {
		let prefix = `/${this.apiPath || ''}`;
		if (apiVersion) {
			prefix += `${apiVersion}/`;
		}
		return `${prefix}${route}${method}`;
	}

	namedRoutes(route: string, endpoints: string[], apiVersion = null): string[] {
		const routeActions = Array.isArray(endpoints) ? endpoints : Object.keys(endpoints);

		return routeActions.map((action) => this.getFullRouteName(route, action, apiVersion));
	}

	// addRoute<TSubPathPattern extends string>(
	// 	subpath: TSubPathPattern,
	// 	operations: Operations<JoinPathPattern<TBasePath, TSubPathPattern>>,
	// ): void;

	// addRoute<TSubPathPattern extends string, TPathPattern extends JoinPathPattern<TBasePath, TSubPathPattern>>(
	// 	subpaths: TSubPathPattern[],
	// 	operations: Operations<TPathPattern>,
	// ): void;

	// addRoute<TSubPathPattern extends string, TOptions extends Options>(
	// 	subpath: TSubPathPattern,
	// 	options: TOptions,
	// 	operations: Operations<JoinPathPattern<TBasePath, TSubPathPattern>, TOptions>,
	// ): void;

	// addRoute<TSubPathPattern extends string, TPathPattern extends JoinPathPattern<TBasePath, TSubPathPattern>, TOptions extends Options>(
	// 	subpaths: TSubPathPattern[],
	// 	options: TOptions,
	// 	operations: Operations<TPathPattern, TOptions>,
	// ): void;

	addRoute(routes: string[], options: Options, endpoints: string[]): void {
		// Note: required if the developer didn't provide options
		if (typeof endpoints === 'undefined') {
			// endpoints = options;
			options = {} as Options;
		}

		let shouldVerifyPermissions: boolean;

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
				// rateLimiterOptions: options.rateLimiterOptions || defaultRateLimiterOptions,
				rateLimiterOptions: defaultRateLimiterOptions,
				endpoints,
				apiVersion: version,
			});
		}
		routes.forEach((route) => {
			// Note: This is required due to Restivus calling `addRoute` in the constructor of itself
			Object.keys(endpoints).forEach((method) => {
				const _options = { ...options };

				if (typeof endpoints[method] === 'function') {
					endpoints[method] = { action: endpoints[method] };
				} else {
					const extraOptions = { ...endpoints[method] };
					delete extraOptions.action;
					Object.assign(_options, extraOptions);
				}
				// Add a try/catch for each endpoint
				const originalAction = endpoints[method].action;
				const api = this;
				endpoints[method].action = function _internalRouteActionHandler(): unknown {
					const rocketchatRestApiEnd = metrics.rocketchatRestApi.startTimer({
						method,
						version,
						...(prometheusAPIUserAgent && { user_agent: this.request.headers['user-agent'] }),
						entrypoint: route.startsWith('method.call') ? decodeURIComponent(this.request._parsedUrl.pathname.slice(8)) : route,
					});

					this.requestIp = getRequestIP(this.request);

					const startTime = Date.now();

					const log = logger.logger.child({
						method: this.request.method,
						url: this.request.url,
						userId: this.request.headers['x-user-id'],
						userAgent: this.request.headers['user-agent'],
						length: this.request.headers['content-length'],
						host: this.request.headers.host,
						referer: this.request.headers.referer,
						remoteIP: this.requestIp,
						...getRestPayload(this.request.body),
					});

					const objectForRateLimitMatch = {
						IPAddr: this.requestIp,
						route: `${this.request.route}${this.request.method.toLowerCase()}`,
					};

					let result;

					const connection: IMethodConnection = {
						id: Random.id(),
						close,
						onClose: close,
						// token: this.token,
						clientAddress: this.requestIp,
						httpHeaders: this.request.headers,
					};

					try {
						api.enforceRateLimit(objectForRateLimitMatch, this.request, this.response, this.userId);

						if (shouldVerifyPermissions && (!this.userId || !hasAllPermission(this.userId, _options.permissionsRequired))) {
							throw new Meteor.Error('error-unauthorized', 'User does not have the permissions required for this action', {
								permissions: _options.permissionsRequired,
							});
						}

						const invocation = new MethodInvocation({
							connection,
							isSimulation: false,
							userId: this.userId,
						});

						Accounts._setAccountData(connection.id, 'loginToken', this.token);

						api.processTwoFactor({
							userId: this.userId,
							request: this.request,
							invocation,
							options: _options,
							connection,
						});

						result = DDP._CurrentInvocation.withValue(invocation, () => Promise.await(originalAction.apply(this))) || API.v1.success();

						log.http({
							status: result.statusCode,
							responseTime: Date.now() - startTime,
						});
					} catch (e) {
						const apiMethod =
							{
								'error-too-many-requests': 'tooManyRequests',
								'error-unauthorized': 'unauthorized',
							}[e.error] || 'failure';

						result = API.v1[apiMethod](typeof e === 'string' ? e : e.message, e.error, process.env.TEST_MODE ? e.stack : undefined, e);

						log.http({
							err: e,
							status: result.statusCode,
							responseTime: Date.now() - startTime,
						});
					} finally {
						delete Accounts._accountData[connection.id];
					}

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

	updateRateLimiterDictionaryForRoute(route: string, numRequestsAllowed: number, intervalTimeInMS: SettingValue): void {
		if (rateLimiterDictionary[route]) {
			rateLimiterDictionary[route].options.numRequestsAllowed =
				numRequestsAllowed ?? rateLimiterDictionary[route].options.numRequestsAllowed;
			rateLimiterDictionary[route].options.intervalTimeInMS = intervalTimeInMS ?? rateLimiterDictionary[route].options.intervalTimeInMS;
			API.v1.reloadRoutesToRefreshRateLimiter();
		}
	}

	_initAuth(this: APIClass): void {
		const loginCompatibility = (bodyParams: ActionThis['bodyParams'], request: Request): unknown => {
			// Grab the username or email that the user is logging in with
			const { user, username, email, password, code: bodyCode } = bodyParams;
			let usernameToLDAPLogin = '';

			if (password == null) {
				return bodyParams;
			}

			if (_.without(Object.keys(bodyParams), 'user', 'username', 'email', 'password', 'code').length > 0) {
				return bodyParams;
			}

			const code = bodyCode || request.headers['x-2fa-code'];

			const auth = {
				user,
				password,
			};

			if (typeof user === 'string') {
				auth.user = user.includes('@') ? { email: user } : { username: user };
				usernameToLDAPLogin = user;
			} else if (username) {
				auth.user = { username };
				usernameToLDAPLogin = username;
			} else if (email) {
				auth.user = { email };
				usernameToLDAPLogin = email;
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

			const objectToLDAPLogin = {
				ldap: true,
				username: usernameToLDAPLogin,
				ldapPass: auth.password,
				ldapOptions: {},
			};
			if (settings.get('LDAP_Enable') && !code) {
				return objectToLDAPLogin;
			}

			if (code) {
				return {
					totp: {
						code,
						login: settings.get('LDAP_Enable') ? objectToLDAPLogin : auth,
					},
				};
			}

			return auth;
		};

		const self = this as IHttpRequest;

		this.addRoute(
			'login',
			{ authRequired: false },
			{
				post(this: ActionThis) {
					const args = loginCompatibility(this.bodyParams, this.request);
					const getUserInfo = self.getHelperMethod('getUserInfo');

					const invocation = new MethodInvocation({
						connection: {
							// eslint-disable-next-line @typescript-eslint/no-empty-function
							close(): void {},
							httpHeaders: this.request.headers,
							clientAddress: getRequestIP(this.request),
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

					this.user = Meteor.users.findOne(
						{
							_id: auth.id,
						},
						{
							fields: getDefaultUserFields(),
						},
					);

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
			},
		);

		const logout = function (this: ActionThis): unknown {
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
					message: "You've been logged out!",
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
		return this.addRoute(
			'logout',
			{
				authRequired: true,
			},
			{
				get() {
					console.warn('Warning: Default logout via GET will be removed in Restivus v1.0. Use POST instead.');
					console.warn('    See https://github.com/kahmali/meteor-restivus/issues/100');
					return logout.call(this);
				},
				post: logout,
			},
		);
	}
}

const getUserAuth = function _getUserAuth(...args: undefined[]): ActionThis {
	const invalidResults = [undefined, null, false];
	return {
		token: 'services.resume.loginTokens.hashedToken',
		user(): unknown {
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

const defaultOptionsEndpoint = function _defaultOptionsEndpoint(this: APIClass.ActionThis): void {
	// check if a pre-flight request
	if (!this.request.headers['access-control-request-method'] && !this.request.headers.origin) {
		this.done();
		return;
	}

	if (!settings.get('API_Enable_CORS')) {
		this.response.writeHead(405);
		this.response.write('CORS not enabled. Go to "Admin > General > REST Api" to enable it.');
		this.done();
		return;
	}

	const CORSOriginSetting = String(settings.get('API_CORS_Origin'));

	const defaultHeaders = {
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, HEAD, PATCH',
		'Access-Control-Allow-Headers':
			'Origin, X-Requested-With, Content-Type, Accept, X-User-Id, X-Auth-Token, x-visitor-token, Authorization',
	};

	if (CORSOriginSetting === '*') {
		this.response.writeHead(200, {
			'Access-Control-Allow-Origin': '*',
			...defaultHeaders,
		});
		this.done();
		return;
	}

	const origins = CORSOriginSetting.trim()
		.split(',')
		.map((origin) => String(origin).trim().toLocaleLowerCase());

	// if invalid origin reply without required CORS headers
	if (!origins.includes(this.request.headers.origin)) {
		this.done();
		return;
	}

	this.response.writeHead(200, {
		'Access-Control-Allow-Origin': this.request.headers.origin,
		'Vary': 'Origin',
		...defaultHeaders,
	});
	this.done();
};

const createApi = function _createApi(_api: APIClass<'/'>, options = {}): APIClass {
	_api =
		_api ||
		new APIClass(
			Object.assign(
				{
					apiPath: 'api/',
					useDefaultAuth: true,
					prettyJson: process.env.NODE_ENV === 'development',
					defaultOptionsEndpoint,
					auth: getUserAuth(),
				},
				options,
			),
		);

	return _api;
};

const createApis = function _createApis(): void {
	API.v1 = createApi(API.v1, {
		version: 'v1',
	});

	API.default = createApi(API.default);
};

// also create the API immediately
createApis();

// register the API to be re-created once the CORS-setting changes.
settings.watchMultiple(['API_Enable_CORS', 'API_CORS_Origin'], () => {
	createApis();
});

settings.watch('Accounts_CustomFields', (value) => {
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

settings.watch('API_Enable_Rate_Limiter_Limit_Time_Default', (value) => {
	defaultRateLimiterOptions.intervalTimeInMS = value;
	API.v1.reloadRoutesToRefreshRateLimiter();
});

settings.watch('API_Enable_Rate_Limiter_Limit_Calls_Default', (value) => {
	defaultRateLimiterOptions.numRequestsAllowed = value;
	API.v1.reloadRoutesToRefreshRateLimiter();
});

settings.watch('Prometheus_API_User_Agent', (value) => {
	prometheusAPIUserAgent = value;
});
