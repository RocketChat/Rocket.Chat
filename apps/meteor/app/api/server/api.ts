import type { IMethodConnection, IUser, IRoom } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import type { JoinPathPattern, Method } from '@rocket.chat/rest-typings';
import express from 'express';
import type { Request, Response } from 'express';
import { Accounts } from 'meteor/accounts-base';
import { DDP } from 'meteor/ddp';
import { DDPCommon } from 'meteor/ddp-common';
import { Meteor } from 'meteor/meteor';
import type { RateLimiterOptionsToCheck } from 'meteor/rate-limit';
import { RateLimiter } from 'meteor/rate-limit';
import { WebApp } from 'meteor/webapp';
import semver from 'semver';
import _ from 'underscore';

import type { PermissionsPayload } from './api.helpers';
import { checkPermissionsForInvocation, checkPermissions, parseDeprecation } from './api.helpers';
import type {
	FailureResult,
	ForbiddenResult,
	InnerAction,
	InternalError,
	NotFoundResult,
	Operations,
	Options,
	PartialThis,
	SuccessResult,
	TypedThis,
	UnauthorizedResult,
} from './definition';
import { getUserInfo } from './helpers/getUserInfo';
import { parseJsonQuery } from './helpers/parseJsonQuery';
import { cors } from './middlewares/cors';
import { loggerMiddleware } from './middlewares/logger';
import { metricsMiddleware } from './middlewares/metrics';
import { tracerSpanMiddleware } from './middlewares/tracer';
import { Router } from './router';
import { isObject } from '../../../lib/utils/isObject';
import { getNestedProp } from '../../../server/lib/getNestedProp';
import { checkCodeForUser } from '../../2fa/server/code';
import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';
import { notifyOnUserChangeAsync } from '../../lib/server/lib/notifyListener';
import { metrics } from '../../metrics/server';
import { settings } from '../../settings/server';
import { Info } from '../../utils/rocketchat.info';
import { getDefaultUserFields } from '../../utils/server/functions/getDefaultUserFields';

const logger = new Logger('API');

// We have some breaking changes planned to the API.
// To avoid conflicts or missing something during the period we are adopting a 'feature flag approach'
// TODO: MAJOR check if this is still needed
const applyBreakingChanges = semver.gte(Info.version, '8.0.0');

interface IAPIProperties {
	useDefaultAuth: boolean;
	prettyJson: boolean;
	version?: string;
	enableCors?: boolean;
	apiPath?: string;
}

interface IAPIDefaultFieldsToExclude {
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
	inviteToken: number;
}

type RateLimiterOptions = {
	numRequestsAllowed?: number;
	intervalTimeInMS?: number;
};

export const defaultRateLimiterOptions: RateLimiterOptions = {
	numRequestsAllowed: settings.get<number>('API_Enable_Rate_Limiter_Limit_Calls_Default'),
	intervalTimeInMS: settings.get<number>('API_Enable_Rate_Limiter_Limit_Time_Default'),
};
const rateLimiterDictionary: Record<
	string,
	{
		rateLimiter: RateLimiter;
		options: RateLimiterOptions;
	}
> = {};

const getRequestIP = (req: Request): string | null => {
	const socket = req.socket || (req.connection as any)?.socket;
	const remoteAddress = String(
		req.headers['x-real-ip'] || (typeof socket !== 'string' && (socket?.remoteAddress || req.connection?.remoteAddress || null)),
	);
	const forwardedFor = String(req.headers['x-forwarded-for']);

	if (!socket) {
		return remoteAddress || forwardedFor || null;
	}

	const httpForwardedCount = parseInt(String(process.env.HTTP_FORWARDED_COUNT)) || 0;
	if (httpForwardedCount <= 0) {
		return remoteAddress;
	}

	if (!forwardedFor || typeof forwardedFor.valueOf() !== 'string') {
		return remoteAddress;
	}

	const forwardedForIPs = forwardedFor.trim().split(/\s*,\s*/);
	if (httpForwardedCount > forwardedForIPs.length) {
		return remoteAddress;
	}

	return forwardedForIPs[forwardedForIPs.length - httpForwardedCount];
};

const generateConnection = (
	ipAddress: string,
	httpHeaders: Record<string, any>,
): {
	id: string;
	close: () => void;
	clientAddress: string;
	httpHeaders: Record<string, any>;
} => ({
	id: Random.id(),
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	close() {},
	httpHeaders,
	clientAddress: ipAddress,
});

export class APIClass<TBasePath extends string = ''> {
	protected apiPath?: string;

	readonly version?: string;

	private _routes: { path: string; options: Options; endpoints: Record<string, string> }[] = [];

	public authMethods: ((...args: any[]) => any)[];

	protected helperMethods: Map<string, () => any> = new Map();

	public fieldSeparator: string;

	public defaultFieldsToExclude: {
		joinCode: number;
		members: number;
		importIds: number;
		e2e: number;
	};

	public defaultLimitedUserFieldsToExclude: IAPIDefaultFieldsToExclude;

	public limitedUserFieldsToExclude: IAPIDefaultFieldsToExclude;

	public limitedUserFieldsToExcludeIfIsPrivilegedUser: {
		services: number;
		inviteToken: number;
	};

	readonly router: Router<any>;

	constructor({ useDefaultAuth, ...properties }: IAPIProperties) {
		this.version = properties.version;

		this.apiPath = [properties.apiPath, properties.version].filter(Boolean).join('/').replaceAll('//', '/');
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
			inviteToken: 0,
		};
		this.limitedUserFieldsToExclude = this.defaultLimitedUserFieldsToExclude;
		this.limitedUserFieldsToExcludeIfIsPrivilegedUser = {
			services: 0,
			inviteToken: 0,
		};

		this.router = new Router(`/${this.apiPath}`.replace(/\/$/, '').replaceAll('//', '/'));

		if (useDefaultAuth) {
			this._initAuth();
		}
	}

	public setLimitedCustomFields(customFields: string[]): void {
		const nonPublicFieds = customFields.reduce(
			(acc, customField) => {
				acc[`customFields.${customField}`] = 0;
				return acc;
			},
			{} as Record<string, any>,
		);
		this.limitedUserFieldsToExclude = {
			...this.defaultLimitedUserFieldsToExclude,
			...nonPublicFieds,
		};
	}

	async parseJsonQuery(this: PartialThis) {
		return parseJsonQuery(this);
	}

	public addAuthMethod(func: (this: PartialThis, ...args: any[]) => any): void {
		this.authMethods.push(func);
	}

	protected shouldAddRateLimitToRoute(options: { rateLimiterOptions?: RateLimiterOptions | boolean }): boolean {
		const { rateLimiterOptions } = options;
		return (
			(typeof rateLimiterOptions === 'object' || rateLimiterOptions === undefined) &&
			Boolean(this.version) &&
			!process.env.TEST_MODE &&
			Boolean(defaultRateLimiterOptions.numRequestsAllowed && defaultRateLimiterOptions.intervalTimeInMS)
		);
	}

	public success(): SuccessResult<void>;

	public success<T>(result: T): SuccessResult<T>;

	public success<T>(result: T = {} as T): SuccessResult<T> {
		if (isObject(result)) {
			(result as Record<string, any>).success = true;
		}

		const finalResult = {
			statusCode: 200,
			body: result,
		} as SuccessResult<T>;

		return finalResult as SuccessResult<T>;
	}

	public failure<T>(result?: T): FailureResult<T>;

	public failure<T, TErrorType extends string, TStack extends string, TErrorDetails>(
		result?: T,
		errorType?: TErrorType,
		stack?: TStack,
		error?: { details: TErrorDetails },
	): FailureResult<T, TErrorType, TStack, TErrorDetails>;

	public failure<T, TErrorType extends string, TStack extends string, TErrorDetails>(
		result?: T,
		errorType?: TErrorType,
		stack?: TStack,
		error?: { details: TErrorDetails },
	): FailureResult<T> {
		const response: {
			statusCode: 400;
			body: any & { message?: string; errorType?: string; stack?: string; success?: boolean; details?: Record<string, any> | string };
		} = { statusCode: 400, body: result };

		if (isObject(result)) {
			response.body.success = false;
		} else {
			response.body = {
				success: false,
				error: result,
				stack,
			};

			if (errorType) {
				response.body.errorType = errorType;
			}

			if (error && typeof error === 'object' && 'details' in error && error?.details) {
				try {
					response.body.details = JSON.parse(error.details as unknown as string);
				} catch (e) {
					response.body.details = error.details;
				}
			}
		}

		return response;
	}

	public notFound(msg?: string): NotFoundResult {
		return {
			statusCode: 404,
			body: {
				success: false,
				error: msg || 'Resource not found',
			},
		};
	}

	public internalError<T>(msg?: T): InternalError<T> {
		return {
			statusCode: 500,
			body: {
				success: false,
				error: msg || 'Internal server error',
			},
		};
	}

	public unauthorized<T>(msg?: T): UnauthorizedResult<T> {
		return {
			statusCode: 401,
			body: {
				success: false,
				error: msg || 'unauthorized',
			},
		};
	}

	public forbidden<T>(msg?: T): ForbiddenResult<T> {
		return {
			statusCode: 403,
			body: {
				success: false,
				// TODO: MAJOR remove 'unauthorized' in favor of 'forbidden'
				// because of reasons beyond my control we were used to send `unauthorized` to 403 cases, to avoid a breaking change we just adapted here
				// but thanks to the semver check tests should break as soon we bump to a new version
				error: msg || (applyBreakingChanges ? 'forbidden' : 'unauthorized'),
			},
		};
	}

	public tooManyRequests(msg?: string): { statusCode: number; body: Record<string, any> & { success?: boolean } } {
		return {
			statusCode: 429,
			body: {
				success: false,
				error: msg || 'Too many requests',
			},
		};
	}

	protected getRateLimiter(route: string): { rateLimiter: RateLimiter; options: RateLimiterOptions } {
		return rateLimiterDictionary[route];
	}

	protected async shouldVerifyRateLimit(route: string, userId?: string): Promise<boolean> {
		return (
			rateLimiterDictionary.hasOwnProperty(route) &&
			settings.get<boolean>('API_Enable_Rate_Limiter') === true &&
			(process.env.NODE_ENV !== 'development' || settings.get<boolean>('API_Enable_Rate_Limiter_Dev') === true) &&
			!(userId && (await hasPermissionAsync(userId, 'api-bypass-rate-limit')))
		);
	}

	protected async enforceRateLimit(
		objectForRateLimitMatch: RateLimiterOptionsToCheck,
		_: any,
		response: Response,
		userId?: string,
	): Promise<void> {
		if (!(await this.shouldVerifyRateLimit(objectForRateLimitMatch.route, userId))) {
			return;
		}

		rateLimiterDictionary[objectForRateLimitMatch.route].rateLimiter.increment(objectForRateLimitMatch);
		const attemptResult = await rateLimiterDictionary[objectForRateLimitMatch.route].rateLimiter.check(objectForRateLimitMatch);
		const timeToResetAttempsInSeconds = Math.ceil(attemptResult.timeToReset / 1000);
		response.setHeader('X-RateLimit-Limit', rateLimiterDictionary[objectForRateLimitMatch.route].options.numRequestsAllowed ?? '');
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

	public reloadRoutesToRefreshRateLimiter(): void {
		this._routes.forEach((route) => {
			if (this.shouldAddRateLimitToRoute(route.options)) {
				this.addRateLimiterRuleForRoutes({
					routes: [route.path],
					rateLimiterOptions: route.options.rateLimiterOptions || defaultRateLimiterOptions,
					endpoints: Object.keys(route.endpoints).filter((endpoint) => endpoint !== 'options'),
				});
			}
		});
	}

	protected addRateLimiterRuleForRoutes({
		routes,
		rateLimiterOptions,
		endpoints,
	}: {
		routes: string[];
		rateLimiterOptions: RateLimiterOptions | boolean;
		endpoints: string[];
	}): void {
		if (typeof rateLimiterOptions !== 'object') {
			throw new Meteor.Error('"rateLimiterOptions" must be an object');
		}
		if (!rateLimiterOptions.numRequestsAllowed) {
			throw new Meteor.Error('You must set "numRequestsAllowed" property in rateLimiter for REST API endpoint');
		}
		if (!rateLimiterOptions.intervalTimeInMS) {
			throw new Meteor.Error('You must set "intervalTimeInMS" property in rateLimiter for REST API endpoint');
		}
		const addRateLimitRuleToEveryRoute = (routes: string[]) => {
			routes.forEach((route) => {
				rateLimiterDictionary[route] = {
					rateLimiter: new RateLimiter(),
					options: rateLimiterOptions,
				};
				const rateLimitRule = {
					IPAddr: (input: any) => input,
					route,
				};
				rateLimiterDictionary[route].rateLimiter.addRule(
					rateLimitRule,
					rateLimiterOptions.numRequestsAllowed as number,
					rateLimiterOptions.intervalTimeInMS as number,
				);
			});
		};
		routes.map((route) => this.namedRoutes(route, endpoints)).map(addRateLimitRuleToEveryRoute);
	}

	public async processTwoFactor({
		userId,
		request,
		invocation,
		options,
		connection,
	}: {
		userId: string;
		request: Request;
		invocation: { twoFactorChecked?: boolean };
		options?: Options;
		connection: IMethodConnection;
	}): Promise<void> {
		if (options && (!('twoFactorRequired' in options) || !options.twoFactorRequired)) {
			return;
		}
		const code = request.headers['x-2fa-code'] ? String(request.headers['x-2fa-code']) : undefined;
		const method = request.headers['x-2fa-method'] ? String(request.headers['x-2fa-method']) : undefined;

		await checkCodeForUser({
			user: userId,
			code,
			method,
			options: options && 'twoFactorOptions' in options ? (options as Record<string, any>).twoFactorOptions || {} : {},
			connection,
		});

		invocation.twoFactorChecked = true;
	}

	protected getFullRouteName(route: string, method: string): string {
		return `/${this.apiPath || ''}/${route}${method}`;
	}

	protected namedRoutes(route: string, endpoints: Record<string, string> | string[]): string[] {
		const routeActions: string[] = Array.isArray(endpoints) ? endpoints : Object.keys(endpoints);

		return routeActions.map((action) => this.getFullRouteName(route, action));
	}

	addRoute<TSubPathPattern extends string>(
		subpath: TSubPathPattern,
		operations: Operations<JoinPathPattern<TBasePath, TSubPathPattern>>,
	): void;

	addRoute<TSubPathPattern extends string, TPathPattern extends JoinPathPattern<TBasePath, TSubPathPattern>>(
		subpaths: TSubPathPattern[],
		operations: Operations<TPathPattern>,
	): void;

	addRoute<TSubPathPattern extends string, TOptions extends Options>(
		subpath: TSubPathPattern,
		options: TOptions,
		operations: Operations<JoinPathPattern<TBasePath, TSubPathPattern>, TOptions>,
	): void;

	addRoute<TSubPathPattern extends string, TPathPattern extends JoinPathPattern<TBasePath, TSubPathPattern>, TOptions extends Options>(
		subpaths: TSubPathPattern[],
		options: TOptions,
		operations: Operations<TPathPattern, TOptions>,
	): void;

	public addRoute<
		TSubPathPattern extends string,
		TPathPattern extends JoinPathPattern<TBasePath, TSubPathPattern>,
		TOptions extends Options,
	>(subpaths: TSubPathPattern[], options: TOptions, endpoints?: Operations<TPathPattern, TOptions>): void {
		// Note: required if the developer didn't provide options
		if (endpoints === undefined) {
			endpoints = options as unknown as Operations<TPathPattern>;
			options = {} as TOptions;
		}

		const operations = endpoints;

		const shouldVerifyPermissions = checkPermissions(options);

		// Allow for more than one route using the same option and endpoints
		if (!Array.isArray(subpaths)) {
			subpaths = [subpaths];
		}
		if (this.shouldAddRateLimitToRoute(options)) {
			this.addRateLimiterRuleForRoutes({
				routes: subpaths,
				rateLimiterOptions: options.rateLimiterOptions || defaultRateLimiterOptions,
				endpoints: operations as unknown as string[],
			});
		}
		subpaths.forEach((route) => {
			// Note: This is required due to Restivus calling `addRoute` in the constructor of itself
			Object.keys(operations).forEach((method) => {
				const _options = { ...options };

				if (typeof operations[method as keyof Operations<TPathPattern, TOptions>] === 'function') {
					(operations as Record<string, any>)[method as string] = {
						action: operations[method as keyof Operations<TPathPattern, TOptions>],
					};
				} else {
					const extraOptions: Record<string, any> = { ...operations[method as keyof Operations<TPathPattern, TOptions>] } as Record<
						string,
						any
					>;
					delete extraOptions.action;
					Object.assign(_options, extraOptions);
				}
				// Add a try/catch for each endpoint
				const originalAction = (operations[method as keyof Operations<TPathPattern, TOptions>] as Record<string, any>).action;
				// eslint-disable-next-line @typescript-eslint/no-this-alias
				const api = this;
				(operations[method as keyof Operations<TPathPattern, TOptions>] as Record<string, any>).action =
					async function _internalRouteActionHandler() {
						this.requestIp = getRequestIP(this.request)!;

						if (options.authRequired || options.authOrAnonRequired) {
							const user = await api.authenticatedRoute(this.request);
							this.user = user!;
							this.userId = String(this.request.headers['x-user-id']);
							this.token = (this.request.headers['x-auth-token'] &&
								Accounts._hashLoginToken(String(this.request.headers['x-auth-token'])))!;
						}

						if (!this.user && options.authRequired && !options.authOrAnonRequired && !settings.get('Accounts_AllowAnonymousRead')) {
							const result = api.unauthorized('You must be logged in to do this.');
							// compatibility with the old API
							// TODO: MAJOR
							if (!applyBreakingChanges) {
								Object.assign(result.body, {
									status: 'error',
									message: 'You must be logged in to do this.',
								});
							}
							return result;
						}

						const objectForRateLimitMatch = {
							IPAddr: this.requestIp,
							route: `/${api.apiPath}${this.request.route.path}${this.request.method.toLowerCase()}`,
						};

						let result;

						const connection = { ...generateConnection(this.requestIp, this.request.headers), token: this.token };

						try {
							if (options.deprecation) {
								parseDeprecation(this, options.deprecation);
							}

							await api.enforceRateLimit(objectForRateLimitMatch, this.request, this.response, this.userId);

							if (_options.validateParams) {
								const requestMethod = this.request.method as Method;
								const validatorFunc =
									typeof _options.validateParams === 'function' ? _options.validateParams : _options.validateParams[requestMethod];

								if (validatorFunc && !validatorFunc(requestMethod === 'GET' ? this.queryParams : this.bodyParams)) {
									throw new Meteor.Error('invalid-params', validatorFunc.errors?.map((error: any) => error.message).join('\n '));
								}
							}
							if (shouldVerifyPermissions) {
								if (!this.userId) {
									if (applyBreakingChanges) {
										throw new Meteor.Error('error-unauthorized', 'You must be logged in to do this');
									}
									throw new Meteor.Error('error-unauthorized', 'User does not have the permissions required for this action');
								}
								if (
									!(await checkPermissionsForInvocation(
										this.userId,
										_options.permissionsRequired as PermissionsPayload,
										this.request.method as Method,
									))
								) {
									if (applyBreakingChanges) {
										throw new Meteor.Error('error-forbidden', 'User does not have the permissions required for this action', {
											permissions: _options.permissionsRequired,
										});
									}
									throw new Meteor.Error('error-unauthorized', 'User does not have the permissions required for this action', {
										permissions: _options.permissionsRequired,
									});
								}
							}

							const invocation = new DDPCommon.MethodInvocation({
								connection,
								isSimulation: false,
								userId: this.userId,
							});

							Accounts._accountData[connection.id] = {
								connection,
							};

							Accounts._setAccountData(connection.id, 'loginToken', this.token!);

							this.userId &&
								(await api.processTwoFactor({
									userId: this.userId,
									request: this.request,
									invocation: invocation as unknown as Record<string, any>,
									options: _options,
									connection: connection as unknown as IMethodConnection,
								}));

							this.queryOperations = options.queryOperations;
							(this as any).queryFields = options.queryFields;
							this.parseJsonQuery = api.parseJsonQuery.bind(this as unknown as PartialThis);

							result =
								(await DDP._CurrentInvocation.withValue(invocation as any, async () => originalAction.apply(this))) || API.v1.success();
						} catch (e: any) {
							result = ((e: any) => {
								switch (e.error) {
									case 'error-too-many-requests':
										return API.v1.tooManyRequests(typeof e === 'string' ? e : e.message);
									case 'unauthorized':
									case 'error-unauthorized':
										if (applyBreakingChanges) {
											return API.v1.unauthorized(typeof e === 'string' ? e : e.message);
										}
										return API.v1.forbidden(typeof e === 'string' ? e : e.message);
									case 'forbidden':
									case 'error-forbidden':
										if (applyBreakingChanges) {
											return API.v1.forbidden(typeof e === 'string' ? e : e.message);
										}
										return API.v1.failure(typeof e === 'string' ? e : e.message, e.error, process.env.TEST_MODE ? e.stack : undefined, e);
									default:
										return API.v1.failure(typeof e === 'string' ? e : e.message, e.error, process.env.TEST_MODE ? e.stack : undefined, e);
								}
							})(e);
						} finally {
							delete Accounts._accountData[connection.id];
						}

						return result;
					} as InnerAction<any, any, any>;

				// Allow the endpoints to make usage of the logger which respects the user's settings
				(operations[method as keyof Operations<TPathPattern, TOptions>] as Record<string, any>).logger = logger;
				this.router[method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'](
					`/${route}`.replaceAll('//', '/'),
					{} as any,
					(operations[method as keyof Operations<TPathPattern, TOptions>] as Record<string, any>).action as any,
				);
				this._routes.push({
					path: route,
					options: _options,
					endpoints: operations[method as keyof Operations<TPathPattern, TOptions>] as Record<string, string>,
				});
			});
		});
	}

	protected async authenticatedRoute(req: Request): Promise<IUser | null> {
		const { 'x-user-id': userId } = req.headers;

		const userToken = String(req.headers['x-auth-token']);

		if (userId && userToken) {
			return Users.findOne(
				{
					'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(userToken),
					'_id': userId,
				},
				{
					projection: getDefaultUserFields(),
				},
			);
		}
		return null;
	}

	public updateRateLimiterDictionaryForRoute(route: string, numRequestsAllowed: number, intervalTimeInMS?: number): void {
		if (rateLimiterDictionary[route]) {
			rateLimiterDictionary[route].options.numRequestsAllowed =
				numRequestsAllowed ?? rateLimiterDictionary[route].options.numRequestsAllowed;
			rateLimiterDictionary[route].options.intervalTimeInMS = intervalTimeInMS ?? rateLimiterDictionary[route].options.intervalTimeInMS;
			API.v1?.reloadRoutesToRefreshRateLimiter();
		}
	}

	protected _initAuth(): void {
		const loginCompatibility = (bodyParams: Record<string, any>, request: Request): Record<string, any> => {
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

			const auth: Record<string, any> = {
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
					digest: auth.password as { hashed: string },
					algorithm: 'sha-256',
				};
			}

			const objectToLDAPLogin = {
				ldap: true,
				username: usernameToLDAPLogin,
				ldapPass: auth.password,
				ldapOptions: {},
			};
			if (settings.get<boolean>('LDAP_Enable') && !code) {
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

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this;

		(this as APIClass<'/v1'>).addRoute(
			'login',
			{ authRequired: false },
			{
				async post() {
					const request = this.request as unknown as Request;
					const args = loginCompatibility(this.bodyParams, request);

					const invocation = new DDPCommon.MethodInvocation({
						connection: generateConnection(getRequestIP(request) || '', this.request.headers),
					});

					try {
						const auth = await DDP._CurrentInvocation.withValue(invocation as any, async () => Meteor.callAsync('login', args));
						this.user = await Users.findOne(
							{
								_id: auth.id,
							},
							{
								projection: getDefaultUserFields(),
							},
						);

						if (!this.user) {
							return self.unauthorized();
						}

						this.userId = this.user._id;

						return self.success({
							status: 'success',
							data: {
								userId: this.userId,
								authToken: auth.token,
								me: await getUserInfo(this.user || ({} as IUser)),
							},
						});
					} catch (error) {
						if (!(error instanceof Meteor.Error)) {
							return self.internalError();
						}

						const result = self.unauthorized();

						if (!applyBreakingChanges) {
							Object.assign(result.body, {
								status: 'error',
								error: error.error,
								details: error.details,
								message: error.reason || error.message,
								...(error.reason === 'User not found' && {
									error: 'Unauthorized',
									message: 'Unauthorized',
								}),
							});
						}
						return result;
					}
				},
			},
		);

		const logout = async function <
			This extends TypedThis<{
				authRequired: true;
				response: any;
			}>,
		>(this: This): Promise<{ status: string; data: { message: string } }> {
			// Remove the given auth token from the user's account
			const hashedToken = this.token;
			const tokenLocation = 'services.resume.loginTokens.hashedToken';
			const index = tokenLocation?.lastIndexOf('.') || 0;
			const tokenPath = tokenLocation?.substring(0, index) || '';
			const tokenFieldName = tokenLocation?.substring(index + 1) || '';
			const tokenToRemove: Record<string, any> = {};
			tokenToRemove[tokenFieldName] = hashedToken;
			const tokenRemovalQuery: Record<string, any> = {};
			tokenRemovalQuery[tokenPath] = tokenToRemove;
			await Users.updateOne(
				{ _id: this.userId },
				{
					$pull: tokenRemovalQuery,
				},
			);

			// TODO this can be optmized so places that care about loginTokens being removed are invoked directly
			// instead of having to listen to every watch.users event
			void notifyOnUserChangeAsync(async () => {
				const userTokens = await Users.findOneById(this.userId, { projection: { [tokenPath]: 1 } });
				if (!userTokens) {
					return;
				}

				const diff = { [tokenPath]: getNestedProp(userTokens, tokenPath) };

				return { clientAction: 'updated', id: this.userId, diff };
			});

			const response = {
				status: 'success',
				data: {
					message: "You've been logged out!",
				},
			};

			return response;
		};

		/*
			Add a logout endpoint to the API
			After the user is logged out, the onLoggedOut hook is called (see Restfully.configure() for
			adding hook).
		*/
		return (this as APIClass<'/v1'>).addRoute<'/v1/logout', { authRequired: true }>(
			'logout' as any,
			{
				authRequired: true,
			},
			{
				async get() {
					console.warn('Warning: Default logout via GET will be removed in Restivus v1.0. Use POST instead.');
					console.warn('    See https://github.com/kahmali/meteor-restivus/issues/100');
					return logout.call(this as any) as any;
				},
				async post() {
					return logout.call(this as any) as any;
				},
			},
		);
	}
}

const createApi = function _createApi(options: { version?: string; apiPath?: string } = {}): APIClass {
	return new APIClass(
		Object.assign(
			{
				apiPath: 'api/',
				useDefaultAuth: true,
				prettyJson: process.env.NODE_ENV === 'development',
			},
			options,
		) as IAPIProperties,
	);
};

export const API: {
	api: Router<'/api'>;
	v1: APIClass<'/v1'>;
	default: APIClass;
	ApiClass: typeof APIClass;
	channels?: {
		create: {
			validate: (params: {
				user: { value: string };
				name?: { key: string; value?: string };
				members?: { key: string; value?: string[] };
				customFields?: { key: string; value?: string };
				teams?: { key: string; value?: string[] };
				teamId?: { key: string; value?: string };
			}) => Promise<void>;
			execute: (
				userId: string,
				params: {
					name?: string;
					members?: string[];
					customFields?: Record<string, any>;
					extraData?: Record<string, any>;
					readOnly?: boolean;
				},
			) => Promise<{ channel: IRoom }>;
		};
	};
} = {
	ApiClass: APIClass,
	api: new Router('/api'),
	v1: createApi({
		apiPath: '',
		version: 'v1',
	}),
	default: createApi({
		apiPath: '',
	}),
};

settings.watch<string>('Accounts_CustomFields', (value) => {
	if (!value) {
		return API.v1?.setLimitedCustomFields([]);
	}
	try {
		const customFields = JSON.parse(value);
		const nonPublicCustomFields = Object.keys(customFields).filter((customFieldKey) => customFields[customFieldKey].public !== true);
		API.v1.setLimitedCustomFields(nonPublicCustomFields);
	} catch (error) {
		console.warn('Invalid Custom Fields', error);
	}
});

settings.watch<number>('API_Enable_Rate_Limiter_Limit_Time_Default', (value) => {
	defaultRateLimiterOptions.intervalTimeInMS = value;
	API.v1.reloadRoutesToRefreshRateLimiter();
});

settings.watch<number>('API_Enable_Rate_Limiter_Limit_Calls_Default', (value) => {
	defaultRateLimiterOptions.numRequestsAllowed = value;
	API.v1.reloadRoutesToRefreshRateLimiter();
});

Meteor.startup(() => {
	(WebApp.connectHandlers as ReturnType<typeof express>).use(
		API.api
			.use((_req, res, next) => {
				res.removeHeader('X-Powered-By');
				next();
			})
			.use(cors(settings))
			.use(loggerMiddleware(logger))
			.use(metricsMiddleware(API.v1, settings, metrics.rocketchatRestApi))
			.use(tracerSpanMiddleware)
			.use(API.v1.router)
			.use(API.default.router).router,
	);
});

(WebApp.connectHandlers as ReturnType<typeof express>)
	.use(
		express.json({
			limit: '50mb',
		}),
	)
	.use(
		express.urlencoded({
			extended: true,
			limit: '50mb',
		}),
	)
	.use(express.query({}));
