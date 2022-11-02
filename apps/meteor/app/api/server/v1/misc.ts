import crypto from 'crypto';

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { EJSON } from 'meteor/ejson';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { escapeHTML } from '@rocket.chat/string-helpers';
import {
	isShieldSvgProps,
	isSpotlightProps,
	isDirectoryProps,
	isMethodCallProps,
	isMethodCallAnonProps,
	isMeteorCall,
	validateParamsPwGetPolicyRest,
} from '@rocket.chat/rest-typings';
import type { IUser } from '@rocket.chat/core-typings';
import { Users as UsersRaw } from '@rocket.chat/models';

import { hasPermission } from '../../../authorization/server';
import { Users } from '../../../models/server';
import { settings } from '../../../settings/server';
import { API } from '../api';
import { getDefaultUserFields } from '../../../utils/server/functions/getDefaultUserFields';
import { getURL } from '../../../utils/lib/getURL';
import { getLogs } from '../../../../server/stream/stdout';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { passwordPolicy } from '../../../lib/server';

/**
 * @openapi
 *  /api/v1/me:
 *    get:
 *      description: Gets user data of the authenticated user
 *      security:
 *        - authenticated: []
 *      responses:
 *        200:
 *          description: The user data of the authenticated user
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                  - $ref: '#/components/schemas/ApiSuccessV1'
 *                  - type: object
 *                    properties:
 *                      name:
 *                        type: string
 *                      username:
 *                        type: string
 *                      nickname:
 *                        type: string
 *                      emails:
 *                        type: array
 *                        items:
 *                          type: object
 *                          properties:
 *                            address:
 *                              type: string
 *                            verified:
 *                              type: boolean
 *                      email:
 *                        type: string
 *                      status:
 *                        $ref: '#/components/schemas/UserStatus'
 *                      statusDefault:
 *                        $ref: '#/components/schemas/UserStatus'
 *                      statusText:
 *                        $ref: '#/components/schemas/UserStatus'
 *                      statusConnection:
 *                        $ref: '#/components/schemas/UserStatus'
 *                      bio:
 *                        type: string
 *                      avatarOrigin:
 *                        type: string
 *                        enum: [none, local, upload, url]
 *                      utcOffset:
 *                        type: number
 *                      language:
 *                        type: string
 *                      settings:
 *                        type: object
 *                        properties:
 *                          preferences:
 *                            type: object
 *                      enableAutoAway:
 *                        type: boolean
 *                      idleTimeLimit:
 *                        type: number
 *                      roles:
 *                        type: array
 *                      active:
 *                        type: boolean
 *                      defaultRoom:
 *                        type: string
 *                      customFields:
 *                        type: array
 *                      requirePasswordChange:
 *                        type: boolean
 *                      requirePasswordChangeReason:
 *                        type: string
 *                      services:
 *                        type: object
 *                        properties:
 *                          github:
 *                            type: object
 *                          gitlab:
 *                            type: object
 *                          password:
 *                            type: object
 *                            properties:
 *                              exists:
 *                                type: boolean
 *                          totp:
 *                            type: object
 *                            properties:
 *                              enabled:
 *                                type: boolean
 *                          email2fa:
 *                            type: object
 *                            properties:
 *                              enabled:
 *                                type: boolean
 *                      statusLivechat:
 *                        type: string
 *                        enum: [available, 'not-available']
 *                      banners:
 *                        type: array
 *                        items:
 *                          type: object
 *                          properties:
 *                            id:
 *                              type: string
 *                            title:
 *                              type: string
 *                            text:
 *                              type: string
 *                            textArguments:
 *                              type: array
 *                              items: {}
 *                            modifiers:
 *                              type: array
 *                              items:
 *                                type: string
 *                            infoUrl:
 *                              type: string
 *                      oauth:
 *                        type: object
 *                        properties:
 *                          authorizedClients:
 *                            type: array
 *                            items:
 *                              type: string
 *                      _updatedAt:
 *                        type: string
 *                        format: date-time
 *                      avatarETag:
 *                        type: string
 *        default:
 *          description: Unexpected error
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */
API.v1.addRoute(
	'me',
	{ authRequired: true },
	{
		async get() {
			const fields = getDefaultUserFields();
			const { services, ...user } = Users.findOneById(this.userId, { fields }) as IUser;

			return API.v1.success(
				this.getUserInfo({
					...user,
					...(services && {
						services: {
							...services,
							password: {
								// The password hash shouldn't be leaked but the client may need to know if it exists.
								exists: Boolean(services?.password?.bcrypt),
							} as any,
						},
					}),
				}),
			);
		},
	},
);

let onlineCache = 0;
let onlineCacheDate = 0;
const cacheInvalid = 60000; // 1 minute

API.v1.addRoute(
	'shield.svg',
	{
		authRequired: false,
		rateLimiterOptions: {
			numRequestsAllowed: 60,
			intervalTimeInMS: 60000,
		},
		validateParams: isShieldSvgProps,
	},
	{
		get() {
			const { type, icon } = this.queryParams;
			let { channel, name } = this.queryParams;
			if (!settings.get('API_Enable_Shields')) {
				throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', {
					route: '/api/v1/shield.svg',
				});
			}

			const types = settings.get<string>('API_Shield_Types');
			if (
				type &&
				types !== '*' &&
				!types
					.split(',')
					.map((t: string) => t.trim())
					.includes(type)
			) {
				throw new Meteor.Error('error-shield-disabled', 'This shield type is disabled', {
					route: '/api/v1/shield.svg',
				});
			}
			const hideIcon = icon === 'false';
			if (hideIcon && (!name || !name.trim())) {
				return API.v1.failure('Name cannot be empty when icon is hidden');
			}

			let text;
			let backgroundColor = '#4c1';
			switch (type) {
				case 'online':
					if (Date.now() - onlineCacheDate > cacheInvalid) {
						onlineCache = Users.findUsersNotOffline().count();
						onlineCacheDate = Date.now();
					}

					text = `${onlineCache} ${TAPi18n.__('Online')}`;
					break;
				case 'channel':
					if (!channel) {
						return API.v1.failure('Shield channel is required for type "channel"');
					}

					text = `#${channel}`;
					break;
				case 'user':
					if (settings.get('API_Shield_user_require_auth') && !this.getLoggedInUser()) {
						return API.v1.failure('You must be logged in to do this.');
					}
					const user = this.getUserFromParams();

					// Respect the server's choice for using their real names or not
					if (user.name && settings.get('UI_Use_Real_Name')) {
						text = `${user.name}`;
					} else {
						text = `@${user.username}`;
					}

					switch (user.status) {
						case 'online':
							backgroundColor = '#1fb31f';
							break;
						case 'away':
							backgroundColor = '#dc9b01';
							break;
						case 'busy':
							backgroundColor = '#bc2031';
							break;
						case 'offline':
							backgroundColor = '#a5a1a1';
					}
					break;
				default:
					text = TAPi18n.__('Join_Chat').toUpperCase();
			}

			const iconSize = hideIcon ? 7 : 24;
			const leftSize = name ? name.length * 6 + 7 + iconSize : iconSize;
			const rightSize = text.length * 6 + 20;
			const width = leftSize + rightSize;
			const height = 20;

			channel = escapeHTML(channel);
			text = escapeHTML(text);
			name = escapeHTML(name);

			return {
				headers: { 'Content-Type': 'image/svg+xml;charset=utf-8' },
				body: `
				<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}">
					<linearGradient id="b" x2="0" y2="100%">
						<stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
						<stop offset="1" stop-opacity=".1"/>
					</linearGradient>
					<mask id="a">
						<rect width="${width}" height="${height}" rx="3" fill="#fff"/>
					</mask>
					<g mask="url(#a)">
						<path fill="#555" d="M0 0h${leftSize}v${height}H0z"/>
						<path fill="${backgroundColor}" d="M${leftSize} 0h${rightSize}v${height}H${leftSize}z"/>
						<path fill="url(#b)" d="M0 0h${width}v${height}H0z"/>
					</g>
						${hideIcon ? '' : `<image x="5" y="3" width="14" height="14" xlink:href="${getURL('/assets/favicon.svg', { full: true })}"/>`}
					<g fill="#fff" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
						${
							name
								? `<text x="${iconSize}" y="15" fill="#010101" fill-opacity=".3">${name}</text>
						<text x="${iconSize}" y="14">${name}</text>`
								: ''
						}
						<text x="${leftSize + 7}" y="15" fill="#010101" fill-opacity=".3">${text}</text>
						<text x="${leftSize + 7}" y="14">${text}</text>
					</g>
				</svg>
			`
					.trim()
					.replace(/\>[\s]+\</gm, '><'),
			} as any;
		},
	},
);

API.v1.addRoute(
	'spotlight',
	{
		authRequired: true,
		validateParams: isSpotlightProps,
	},
	{
		get() {
			const { query } = this.queryParams;

			const result = Meteor.call('spotlight', query);

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'directory',
	{
		authRequired: true,
		validateParams: isDirectoryProps,
	},
	{
		get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, query } = this.parseJsonQuery();

			const { text, type, workspace = 'local' } = query;

			if (sort && Object.keys(sort).length > 1) {
				return API.v1.failure('This method support only one "sort" parameter');
			}
			const sortBy = sort ? Object.keys(sort)[0] : undefined;
			const sortDirection = sort && Object.values(sort)[0] === 1 ? 'asc' : 'desc';

			const result = Meteor.call('browseChannels', {
				text,
				type,
				workspace,
				sortBy,
				sortDirection,
				offset: Math.max(0, offset),
				limit: Math.max(0, count),
			});

			if (!result) {
				return API.v1.failure('Please verify the parameters');
			}
			return API.v1.success({
				result: result.results,
				count: result.results.length,
				offset,
				total: result.total,
			});
		},
	},
);

API.v1.addRoute(
	'pw.getPolicy',
	{
		authRequired: true,
	},
	{
		get() {
			return API.v1.success(passwordPolicy.getPasswordPolicy());
		},
	},
);

API.v1.addRoute(
	'pw.getPolicyReset',
	{
		authRequired: false,
		validateParams: validateParamsPwGetPolicyRest,
	},
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					token: String,
				}),
			);
			const { token } = this.queryParams;

			const user = await UsersRaw.findOneByResetToken(token, { projection: { _id: 1 } });
			if (!user) {
				return API.v1.unauthorized();
			}

			return API.v1.success(passwordPolicy.getPasswordPolicy());
		},
	},
);

/**
 * @openapi
 *  /api/v1/stdout.queue:
 *    get:
 *      description: Retrieves last 1000 lines of server logs
 *      security:
 *        - authenticated: ['view-logs']
 *      responses:
 *        200:
 *          description: The user data of the authenticated user
 *          content:
 *            application/json:
 *              schema:
 *                allOf:
 *                  - $ref: '#/components/schemas/ApiSuccessV1'
 *                  - type: object
 *                    properties:
 *                      queue:
 *                        type: array
 *                        items:
 *                          type: object
 *                          properties:
 *                            id:
 *                              type: string
 *                            string:
 *                              type: string
 *                            ts:
 *                              type: string
 *                              format: date-time
 *        default:
 *          description: Unexpected error
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */
API.v1.addRoute(
	'stdout.queue',
	{ authRequired: true },
	{
		get() {
			if (!hasPermission(this.userId, 'view-logs')) {
				return API.v1.unauthorized();
			}
			return API.v1.success({ queue: getLogs() });
		},
	},
);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'method.call/:method': {
			POST: (params: { method: string; args: any[] }) => any;
		};
		'method.callAnon/:method': {
			POST: (params: { method: string; args: any[] }) => any;
		};
	}
}

const mountResult = ({
	id,
	error,
	result,
}: {
	id: string;
	error?: unknown;
	result?: unknown;
}): {
	message: string;
} => ({
	message: EJSON.stringify({
		msg: 'result',
		id,
		error: error as any,
		result: result as any,
	}),
});

// had to create two different endpoints for authenticated and non-authenticated calls
// because restivus does not provide 'this.userId' if 'authRequired: false'
API.v1.addRoute(
	'method.call/:method',
	{
		authRequired: true,
		rateLimiterOptions: false,
		validateParams: isMeteorCall,
	},
	{
		post() {
			check(this.bodyParams, {
				message: String,
			});

			const data = EJSON.parse(this.bodyParams.message);

			if (!isMethodCallProps(data)) {
				return API.v1.failure('Invalid method call');
			}

			const { method, params, id } = data;

			const connectionId =
				this.token ||
				crypto
					.createHash('md5')
					.update(this.requestIp + this.request.headers['user-agent'])
					.digest('hex');

			const rateLimiterInput = {
				userId: this.userId,
				clientAddress: this.requestIp,
				type: 'method',
				name: method,
				connectionId,
			};

			try {
				DDPRateLimiter._increment(rateLimiterInput);
				const rateLimitResult = DDPRateLimiter._check(rateLimiterInput);
				if (!rateLimitResult.allowed) {
					throw new Meteor.Error('too-many-requests', DDPRateLimiter.getErrorMessage(rateLimitResult), {
						timeToReset: rateLimitResult.timeToReset,
					});
				}

				const result = Meteor.call(method, ...params);
				return API.v1.success(mountResult({ id, result }));
			} catch (error) {
				if (error instanceof Error) SystemLogger.error(`Exception while invoking method ${method}`, error.message);
				else SystemLogger.error(`Exception while invoking method ${method}`, error);

				if (settings.get('Log_Level') === '2') {
					Meteor._debug(`Exception while invoking method ${method}`, error);
				}
				return API.v1.success(mountResult({ id, error }));
			}
		},
	},
);
API.v1.addRoute(
	'method.callAnon/:method',
	{
		authRequired: false,
		rateLimiterOptions: false,
		validateParams: isMeteorCall,
	},
	{
		post() {
			check(this.bodyParams, {
				message: String,
			});

			const data = EJSON.parse(this.bodyParams.message);

			if (!isMethodCallAnonProps(data)) {
				return API.v1.failure('Invalid method call');
			}

			const { method, params, id } = data;

			const connectionId =
				this.token ||
				crypto
					.createHash('md5')
					.update(this.requestIp + this.request.headers['user-agent'])
					.digest('hex');

			const rateLimiterInput = {
				userId: this.userId || undefined,
				clientAddress: this.requestIp,
				type: 'method',
				name: method,
				connectionId,
			};

			try {
				DDPRateLimiter._increment(rateLimiterInput);
				const rateLimitResult = DDPRateLimiter._check(rateLimiterInput);
				if (!rateLimitResult.allowed) {
					throw new Meteor.Error('too-many-requests', DDPRateLimiter.getErrorMessage(rateLimitResult), {
						timeToReset: rateLimitResult.timeToReset,
					});
				}

				const result = Meteor.call(method, ...params);
				return API.v1.success(mountResult({ id, result }));
			} catch (error) {
				if (error instanceof Error) SystemLogger.error(`Exception while invoking method ${method}`, error.message);
				else SystemLogger.error(`Exception while invoking method ${method}`, error);

				if (settings.get('Log_Level') === '2') {
					Meteor._debug(`Exception while invoking method ${method}`, error);
				}
				return API.v1.success(mountResult({ id, error }));
			}
		},
	},
);
