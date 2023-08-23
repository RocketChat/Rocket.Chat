import type { IMethodConnection, IUser, IRoom } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import type { JoinPathPattern, Method } from '@rocket.chat/rest-typings';
import { Accounts } from 'meteor/accounts-base';
import { DDP } from 'meteor/ddp';
import { DDPCommon } from 'meteor/ddp-common';
import { Meteor } from 'meteor/meteor';
import type { RateLimiterOptionsToCheck } from 'meteor/rate-limit';
import { RateLimiter } from 'meteor/rate-limit';
import type { Request, Response } from 'meteor/rocketchat:restivus';
import { Restivus } from 'meteor/rocketchat:restivus';
import _ from 'underscore';

import { isObject } from '../../../lib/utils/isObject';
import { getRestPayload } from '../../../server/lib/logger/logPayloads';
import { checkCodeForUser } from '../../2fa/server/code';
import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';
import { apiDeprecationLogger } from '../../lib/server/lib/deprecationWarningLogger';
import { metrics } from '../../metrics/server';
import { settings } from '../../settings/server';
import { getDefaultUserFields } from '../../utils/server/functions/getDefaultUserFields';
import type { PermissionsPayload } from './api.helpers';
import { checkPermissionsForInvocation, checkPermissions } from './api.helpers';
import type {
	FailureResult,
	InternalError,
	NotFoundResult,
	Operations,
	Options,
	PartialThis,
	SuccessResult,
	UnauthorizedResult,
} from './definition';
import { getUserInfo } from './helpers/getUserInfo';
import { parseJsonQuery } from './helpers/parseJsonQuery';

const logger = new Logger('API');

interface IAPIProperties {
	useDefaultAuth: boolean;
	prettyJson: boolean;
	auth: { token: string; user: () => Promise<{ userId: string; token: string }> };
	defaultOptionsEndpoint?: () => Promise<void>;
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
	const socket = req.socket || req.connection?.socket;
	const remoteAddress =
		req.headers['x-real-ip'] || (typeof socket !== 'string' && (socket?.remoteAddress || req.connection?.remoteAddress || null));
	let forwardedFor = req.headers['x-forwarded-for'];

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

	forwardedFor = forwardedFor.trim().split(/\s*,\s*/);
	if (httpForwardedCount > forwardedFor.length) {
		return remoteAddress;
	}

	return forwardedFor[forwardedFor.length - httpForwardedCount];
};

let prometheusAPIUserAgent = false;

export class APIClass<TBasePath extends string = ''> extends Restivus {
	protected apiPath?: string;

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
	};

	constructor(properties: IAPIProperties) {
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

	public setLimitedCustomFields(customFields: string[]): void {
		const nonPublicFieds = customFields.reduce((acc, customField) => {
			acc[`customFields.${customField}`] = 0;
			return acc;
		}, {} as Record<string, any>);
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
		const { version } = this._config;
		const { rateLimiterOptions } = options;
		return (
			(typeof rateLimiterOptions === 'object' || rateLimiterOptions === undefined) &&
			Boolean(version) &&
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
				error: msg || 'Internal error occured',
			},
		};
	}

	public unauthorized<T>(msg?: T): UnauthorizedResult<T> {
		return {
			statusCode: 403,
			body: {
				success: false,
				error: msg || 'unauthorized',
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

	protected async shouldVerifyRateLimit(route: string, userId: string): Promise<boolean> {
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
		userId: string,
	): Promise<void> {
		if (!(await this.shouldVerifyRateLimit(objectForRateLimitMatch.route, userId))) {
			return;
		}

		rateLimiterDictionary[objectForRateLimitMatch.route].rateLimiter.increment(objectForRateLimitMatch);
		const attemptResult = rateLimiterDictionary[objectForRateLimitMatch.route].rateLimiter.check(objectForRateLimitMatch);
		const timeToResetAttempsInSeconds = Math.ceil(attemptResult.timeToReset / 1000);
		response.setHeader('X-RateLimit-Limit', rateLimiterDictionary[objectForRateLimitMatch.route].options.numRequestsAllowed);
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

	protected addRateLimiterRuleForRoutes({
		routes,
		rateLimiterOptions,
		endpoints,
		apiVersion,
	}: {
		routes: string[];
		rateLimiterOptions: RateLimiterOptions | boolean;
		endpoints: string[];
		apiVersion?: string;
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
		routes.map((route) => this.namedRoutes(route, endpoints, apiVersion)).map(addRateLimitRuleToEveryRoute);
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
		const code = request.headers['x-2fa-code'];
		const method = request.headers['x-2fa-method'];

		await checkCodeForUser({
			user: userId,
			code,
			method,
			options: options && 'twoFactorOptions' in options ? (options as Record<string, any>).twoFactorOptions || {} : {},
			connection,
		});

		invocation.twoFactorChecked = true;
	}

	protected getFullRouteName(route: string, method: string, apiVersion?: string): string {
		let prefix = `/${this.apiPath || ''}`;
		if (apiVersion) {
			prefix += `${apiVersion}/`;
		}
		return `${prefix}${route}${method}`;
	}

	protected namedRoutes(route: string, endpoints: Record<string, string> | string[], apiVersion?: string): string[] {
		const routeActions: string[] = Array.isArray(endpoints) ? endpoints : Object.keys(endpoints);

		return routeActions.map((action) => this.getFullRouteName(route, action, apiVersion));
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
		const { version } = this._config;
		if (this.shouldAddRateLimitToRoute(options)) {
			this.addRateLimiterRuleForRoutes({
				routes: subpaths,
				rateLimiterOptions: options.rateLimiterOptions || defaultRateLimiterOptions,
				endpoints: operations as unknown as string[],
				apiVersion: version,
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

						// If the endpoint requires authentication only if anonymous read is disabled, load the user info if it was provided
						if (!options.authRequired && options.authOrAnonRequired) {
							const { 'x-user-id': userId, 'x-auth-token': userToken } = this.request.headers;
							if (userId && userToken) {
								this.user = await Users.findOne(
									{
										'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(userToken),
										'_id': userId,
									},
									{
										projection: getDefaultUserFields(),
									},
								);

								this.userId = this.user?._id;
							}

							if (!this.user && !settings.get('Accounts_AllowAnonymousRead')) {
								return {
									statusCode: 401,
									body: {
										status: 'error',
										message: 'You must be logged in to do this.',
									},
								};
							}
						}

						const objectForRateLimitMatch = {
							IPAddr: this.requestIp,
							route: `${this.request.route}${this.request.method.toLowerCase()}`,
						};

						let result;

						const connection = {
							id: Random.id(),
							// eslint-disable-next-line @typescript-eslint/no-empty-function
							close() {},
							token: this.token,
							httpHeaders: this.request.headers,
							clientAddress: this.requestIp,
						};

						try {
							if (options.deprecationVersion) {
								apiDeprecationLogger.endpoint(this.request.route, options.deprecationVersion, this.response);
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
							if (
								shouldVerifyPermissions &&
								(!this.userId ||
									!(await checkPermissionsForInvocation(
										this.userId,
										_options.permissionsRequired as PermissionsPayload,
										this.request.method,
									)))
							) {
								throw new Meteor.Error('error-unauthorized', 'User does not have the permissions required for this action', {
									permissions: _options.permissionsRequired,
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

							await api.processTwoFactor({
								userId: this.userId,
								request: this.request,
								invocation: invocation as unknown as Record<string, any>,
								options: _options,
								connection: connection as unknown as IMethodConnection,
							});

							this.queryOperations = options.queryOperations;
							this.queryFields = options.queryFields;
							this.parseJsonQuery = api.parseJsonQuery.bind(this as PartialThis);

							result =
								(await DDP._CurrentInvocation.withValue(invocation as any, async () => originalAction.apply(this))) || API.v1.success();

							log.http({
								status: result.statusCode,
								responseTime: Date.now() - startTime,
							});
						} catch (e: any) {
							const apiMethod: string =
								{
									'error-too-many-requests': 'tooManyRequests',
									'error-unauthorized': 'unauthorized',
								}[e.error as string] || 'failure';

							result = (API.v1 as Record<string, any>)[apiMethod](
								typeof e === 'string' ? e : e.message,
								e.error,
								process.env.TEST_MODE ? e.stack : undefined,
								e,
							);

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

				// Allow the endpoints to make usage of the logger which respects the user's settings
				(operations[method as keyof Operations<TPathPattern, TOptions>] as Record<string, any>).logger = logger;
			});

			super.addRoute(route, options, operations);
		});
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

		(this as APIClass<'/v1'>).addRoute<'/v1/login', { authRequired: false }>(
			'login' as any,
			{ authRequired: false },
			{
				async post() {
					const request = this.request as unknown as Request;
					const args = loginCompatibility(this.bodyParams, request);

					const invocation = new DDPCommon.MethodInvocation({
						connection: {
							// eslint-disable-next-line @typescript-eslint/no-empty-function
							close() {},
							httpHeaders: this.request.headers,
							clientAddress: getRequestIP(request) || '',
						},
					});

					let auth;
					try {
						auth = await DDP._CurrentInvocation.withValue(invocation as any, async () => Meteor.callAsync('login', args));
					} catch (error: any) {
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
						} as unknown as SuccessResult<Record<string, any>>;
					}

					this.user = await Users.findOne(
						{
							_id: auth.id,
						},
						{
							projection: getDefaultUserFields(),
						},
					);

					this.userId = (this.user as unknown as IUser)?._id;

					const response = {
						status: 'success',
						data: {
							userId: this.userId,
							authToken: auth.token,
							me: await getUserInfo(this.user || ({} as IUser)),
						},
					};

					const extraData = self._config.onLoggedIn?.call(this);

					if (extraData != null) {
						_.extend(response.data, {
							extra: extraData,
						});
					}

					return response as unknown as SuccessResult<Record<string, any>>;
				},
			},
		);

		const logout = async function (this: Restivus): Promise<{ status: string; data: { message: string } }> {
			// Remove the given auth token from the user's account
			const authToken = this.request.headers['x-auth-token'];
			const hashedToken = Accounts._hashLoginToken(authToken);
			const tokenLocation = self._config?.auth?.token;
			const index = tokenLocation?.lastIndexOf('.') || 0;
			const tokenPath = tokenLocation?.substring(0, index) || '';
			const tokenFieldName = tokenLocation?.substring(index + 1) || '';
			const tokenToRemove: Record<string, any> = {};
			tokenToRemove[tokenFieldName] = hashedToken;
			const tokenRemovalQuery: Record<string, any> = {};
			tokenRemovalQuery[tokenPath] = tokenToRemove;

			await Users.updateOne(
				{ _id: this.user._id },
				{
					$pull: tokenRemovalQuery,
				},
			);

			const response = {
				status: 'success',
				data: {
					message: "You've been logged out!",
				},
			};

			// Call the logout hook with the authenticated user attached
			const extraData = self._config.onLoggedOut?.call(this);
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
		return (this as APIClass<'/v1'>).addRoute<'/v1/logout', { authRequired: true }>(
			'logout' as any,
			{
				authRequired: true,
			},
			{
				async get() {
					console.warn('Warning: Default logout via GET will be removed in Restivus v1.0. Use POST instead.');
					console.warn('    See https://github.com/kahmali/meteor-restivus/issues/100');
					return logout.call(this as unknown as Restivus) as any;
				},
				async post() {
					return logout.call(this as unknown as Restivus) as any;
				},
			},
		);
	}
}

const getUserAuth = function _getUserAuth(...args: any[]): {
	token: string;
	user: (this: Restivus) => Promise<{ userId: string; token: string }>;
} {
	const invalidResults = [undefined, null, false];
	return {
		token: 'services.resume.loginTokens.hashedToken',
		async user() {
			if (this.bodyParams?.payload) {
				this.bodyParams = JSON.parse(this.bodyParams.payload);
			}

			for await (const method of API.v1?.authMethods || []) {
				if (typeof method === 'function') {
					const result = await method.apply(this, args);
					if (!invalidResults.includes(result)) {
						return result;
					}
				}
			}

			let token;
			if (this.request.headers['x-auth-token']) {
				token = Accounts._hashLoginToken(this.request.headers['x-auth-token']);
			}

			this.token = token || '';

			return {
				userId: this.request.headers['x-user-id'],
				token,
			};
		},
	};
};

const defaultOptionsEndpoint = async function _defaultOptionsEndpoint(this: Restivus): Promise<void> {
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

const createApi = function _createApi(options: { version?: string } = {}): APIClass {
	return new APIClass(
		Object.assign(
			{
				apiPath: 'api/',
				useDefaultAuth: true,
				prettyJson: process.env.NODE_ENV === 'development',
				defaultOptionsEndpoint,
				auth: getUserAuth(),
			},
			options,
		) as IAPIProperties,
	);
};

export const API: {
	v1: APIClass<'/v1'>;
	default: APIClass;
	getUserAuth: () => { token: string; user: (this: Restivus) => Promise<{ userId: string; token: string }> };
	ApiClass: typeof APIClass;
	channels?: {
		create: {
			validate: (params: {
				user: { value: string };
				name?: { key: string; value?: string };
				members?: { key: string; value?: string[] };
				customFields?: { key: string; value?: string };
				teams?: { key: string; value?: string[] };
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
	getUserAuth,
	ApiClass: APIClass,
	v1: createApi({
		version: 'v1',
	}),
	default: createApi(),
};

// register the API to be re-created once the CORS-setting changes.
settings.watchMultiple(['API_Enable_CORS', 'API_CORS_Origin'], () => {
	API.v1 = createApi({
		version: 'v1',
	});

	API.default = createApi();
});

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

settings.watch<boolean>('Prometheus_API_User_Agent', (value) => {
	prometheusAPIUserAgent = value;
});
