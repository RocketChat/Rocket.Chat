import crypto from 'crypto';

import type { IUser } from '@rocket.chat/core-typings';
import { Settings, Users, WorkspaceCredentials } from '@rocket.chat/models';
import {
	isShieldSvgProps,
	isSpotlightProps,
	isDirectoryProps,
	isMethodCallProps,
	isMethodCallAnonProps,
	isFingerprintProps,
	isMeteorCall,
} from '@rocket.chat/rest-typings';
import { escapeHTML } from '@rocket.chat/string-helpers';
import EJSON from 'ejson';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';
import { v4 as uuidv4 } from 'uuid';

import { i18n } from '../../../../server/lib/i18n';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { resetAuditedSettingByUser, updateAuditedByUser } from '../../../../server/settings/lib/auditedSettingUpdates';
import { getLogs } from '../../../../server/stream/stdout';
import { passwordPolicy } from '../../../lib/server';
import { notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';
import { getBaseUserFields } from '../../../utils/server/functions/getBaseUserFields';
import { isSMTPConfigured } from '../../../utils/server/functions/isSMTPConfigured';
import { getURL } from '../../../utils/server/getURL';
import { API } from '../api';
import { getLoggedInUser } from '../helpers/getLoggedInUser';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { getUserFromParams } from '../helpers/getUserFromParams';
import { getUserInfo } from '../helpers/getUserInfo';

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
			const userFields = { ...getBaseUserFields(), services: 1 };
			const user = (await Users.findOneById(this.userId, { projection: userFields })) as IUser;

			return API.v1.success(await getUserInfo(user));
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
		async get() {
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
			if (hideIcon && !name?.trim()) {
				return API.v1.failure('Name cannot be empty when icon is hidden');
			}

			let text;
			let backgroundColor = '#4c1';
			switch (type) {
				case 'online':
					if (Date.now() - onlineCacheDate > cacheInvalid) {
						onlineCache = await Users.countUsersNotOffline();
						onlineCacheDate = Date.now();
					}

					text = `${onlineCache} ${i18n.t('Online')}`;
					break;
				case 'channel':
					if (!channel) {
						return API.v1.failure('Shield channel is required for type "channel"');
					}

					text = `#${channel}`;
					break;
				case 'user':
					if (settings.get('API_Shield_user_require_auth') && !(await getLoggedInUser(this.request))) {
						return API.v1.failure('You must be logged in to do this.');
					}
					const user = await getUserFromParams(this.queryParams);

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
					text = i18n.t('Join_Chat').toUpperCase();
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
		async get() {
			const { query } = this.queryParams;

			const result = await Meteor.callAsync('spotlight', query);

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
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, query } = await this.parseJsonQuery();
			const { text, type, workspace = 'local' } = this.queryParams;

			const filter = {
				...(query ? { ...query } : {}),
				...(text ? { text } : {}),
				...(type ? { type } : {}),
				...(workspace ? { workspace } : {}),
			};

			if (sort && Object.keys(sort).length > 1) {
				return API.v1.failure('This method support only one "sort" parameter');
			}
			const sortBy = sort ? Object.keys(sort)[0] : undefined;
			const sortDirection = sort && Object.values(sort)[0] === 1 ? 'asc' : 'desc';

			const result = await Meteor.callAsync('browseChannels', {
				...filter,
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
		authRequired: false,
	},
	{
		get() {
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
	{ authRequired: true, permissionsRequired: ['view-logs'] },
	{
		async get() {
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
		async post() {
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
					.update(this.requestIp + this.user._id)
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

				const result = await Meteor.callAsync(method, ...params);
				return API.v1.success(mountResult({ id, result }));
			} catch (err) {
				if (!(err as any).isClientSafe && !(err as any).meteorError) {
					SystemLogger.error({ msg: `Exception while invoking method ${method}`, err });
				}

				if (settings.get('Log_Level') === '2') {
					Meteor._debug(`Exception while invoking method ${method}`, err);
				}
				return API.v1.success(mountResult({ id, error: err }));
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
		async post() {
			check(this.bodyParams, {
				message: String,
			});

			const data = EJSON.parse(this.bodyParams.message);

			if (!isMethodCallAnonProps(data)) {
				return API.v1.failure('Invalid method call');
			}

			const { method, params, id } = data;

			const connectionId = this.token || crypto.createHash('md5').update(this.requestIp).digest('hex');

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

				const result = await Meteor.callAsync(method, ...params);
				return API.v1.success(mountResult({ id, result }));
			} catch (err) {
				if (!(err as any).isClientSafe && !(err as any).meteorError) {
					SystemLogger.error({ msg: `Exception while invoking method ${method}`, err });
				}
				if (settings.get('Log_Level') === '2') {
					Meteor._debug(`Exception while invoking method ${method}`, err);
				}
				return API.v1.success(mountResult({ id, error: err }));
			}
		},
	},
);

API.v1.addRoute(
	'smtp.check',
	{ authRequired: true },
	{
		async get() {
			return API.v1.success({ isSMTPConfigured: isSMTPConfigured() });
		},
	},
);

/**
 * @openapi
 *  /api/v1/fingerprint:
 *    post:
 *      description: Update Fingerprint definition as a new workspace or update of configuration
 *      security:
 *        $ref: '#/security/authenticated'
 *      requestBody:
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                setDeploymentAs:
 *                  type: string
 *            example: |
 *              {
 *                 "setDeploymentAs": "new-workspace"
 *              }
 *      responses:
 *        200:
 *          description: Workspace successfully configured
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiSuccessV1'
 *        default:
 *          description: Unexpected error
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */
API.v1.addRoute(
	'fingerprint',
	{
		authRequired: true,
		validateParams: isFingerprintProps,
	},
	{
		async post() {
			check(this.bodyParams, {
				setDeploymentAs: String,
			});

			const settingsIds: string[] = [];

			if (this.bodyParams.setDeploymentAs === 'new-workspace') {
				await WorkspaceCredentials.removeAllCredentials();

				settingsIds.push(
					'Cloud_Service_Agree_PrivacyTerms',
					'Cloud_Workspace_Id',
					'Cloud_Workspace_Name',
					'Cloud_Workspace_Client_Id',
					'Cloud_Workspace_Client_Secret',
					'Cloud_Workspace_Client_Secret_Expires_At',
					'Cloud_Workspace_Registration_Client_Uri',
					'Cloud_Workspace_PublicKey',
					'Cloud_Workspace_License',
					'Cloud_Workspace_Had_Trial',
					'uniqueID',
				);
			}

			settingsIds.push('Deployment_FingerPrint_Verified');

			const auditSettingOperation = updateAuditedByUser({
				_id: this.userId,
				username: this.user.username!,
				ip: this.requestIp,
				useragent: this.request.headers.get('user-agent') || '',
			});

			const promises = settingsIds.map((settingId) => {
				if (settingId === 'uniqueID') {
					return auditSettingOperation(Settings.resetValueById, 'uniqueID', process.env.DEPLOYMENT_ID || uuidv4());
				}

				if (settingId === 'Cloud_Workspace_Access_Token_Expires_At') {
					return auditSettingOperation(Settings.resetValueById, 'Cloud_Workspace_Access_Token_Expires_At', new Date(0));
				}

				if (settingId === 'Deployment_FingerPrint_Verified') {
					return auditSettingOperation(Settings.updateValueById, 'Deployment_FingerPrint_Verified', true);
				}

				return resetAuditedSettingByUser({
					_id: this.userId,
					username: this.user.username!,
					ip: this.requestIp,
					useragent: this.request.headers.get('user-agent') || '',
				})(Settings.resetValueById, settingId);
			});

			(await Promise.all(promises)).forEach((value, index) => {
				if (value?.modifiedCount) {
					void notifyOnSettingChangedById(settingsIds[index]);
				}
			});

			return API.v1.success({});
		},
	},
);
