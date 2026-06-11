import crypto from 'node:crypto';

import { AISearch } from '@rocket.chat/core-services';
import type { IDirectoryChannelResult, IDirectoryUserResult, IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Settings, Users, WorkspaceCredentials } from '@rocket.chat/models';
import {
	ajv,
	isShieldSvgProps,
	isSpotlightProps,
	isUnifiedSearchProps,
	isSearchAnswerProps,
	isDirectoryProps,
	isFingerprintProps,
	isMeteorCall,
	meSuccessResponseSchema,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	validateBadRequestErrorResponse,
} from '@rocket.chat/rest-typings';
import type { MeApiSuccessResponse, UnifiedSearchIntelligentResult, UnifiedSearchMessageResult } from '@rocket.chat/rest-typings';
import { escapeHTML } from '@rocket.chat/string-helpers';
import EJSON from 'ejson';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import { i18n } from '../../../../server/lib/i18n';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { browseChannelsMethod } from '../../../../server/methods/browseChannels';
import { messageSearch } from '../../../../server/methods/messageSearch';
import { spotlightMethod } from '../../../../server/publications/spotlight';
import { resetAuditedSettingByUser, updateAuditedByUser } from '../../../../server/settings/lib/auditedSettingUpdates';
import { passwordPolicy } from '../../../lib/server';
import { notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';
import { getBaseUserFields } from '../../../utils/server/functions/getBaseUserFields';
import { isSMTPConfigured } from '../../../utils/server/functions/isSMTPConfigured';
import { getURL } from '../../../utils/server/getURL';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { API } from '../api';
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
API.v1.get(
	'me',
	{
		authRequired: true,
		userWithoutUsername: true,
		response: {
			200: ajv.compile<MeApiSuccessResponse>(meSuccessResponseSchema),
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const userFields = { ...getBaseUserFields(), services: 1 };
		const user = (await Users.findOneById(this.userId, { projection: userFields })) as IUser;

		return API.v1.success(await getUserInfo(user));
	},
);

let onlineCache = 0;
let onlineCacheDate = 0;
const cacheInvalid = 60000; // 1 minute

const shieldSvgResponseSchema = ajv.compile<string>({
	type: 'string',
	description: 'SVG image markup',
});

API.v1.get(
	'shield.svg',
	{
		authRequired: false,
		rateLimiterOptions: {
			numRequestsAllowed: 60,
			intervalTimeInMS: 60000,
		},
		query: isShieldSvgProps,
		response: {
			200: shieldSvgResponseSchema,
			400: validateBadRequestErrorResponse,
		},
	},
	async function action() {
		const { type, icon } = this.queryParams;
		const { channel } = this.queryParams;
		let { name } = this.queryParams;
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
			case 'user': {
				if (settings.get('API_Shield_user_require_auth') && !this.user) {
					return API.v1.failure('You must be logged in to do this.');
				}
				const user = await getUserFromParams(this.queryParams);

				// Respect the server's choice for using their real names or not
				if (user.name && settings.get('UI_Use_Real_Name')) {
					text = `${user.name}`;
				} else {
					text = `@${user.username}`;
				}

				const statusColors: Record<string, string> = {
					online: '#1fb31f',
					away: '#dc9b01',
					busy: '#bc2031',
					offline: '#a5a1a1',
				};
				if (user.status && statusColors[user.status]) {
					backgroundColor = statusColors[user.status];
				}
				break;
			}
			default:
				text = i18n.t('Join_Chat').toUpperCase();
		}

		const iconSize = hideIcon ? 7 : 24;
		const leftSize = name ? name.length * 6 + 7 + iconSize : iconSize;
		const rightSize = text.length * 6 + 20;
		const width = leftSize + rightSize;
		const height = 20;

		text = escapeHTML(text);
		name = escapeHTML(name);

		const svgBody = `
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
			.replace(/>[\s]+</gm, '><');

		return {
			statusCode: 200 as const,
			body: svgBody,
			headers: { 'Content-Type': 'image/svg+xml;charset=utf-8' },
		};
	},
);

const spotlightUsersSchema = {
	type: 'array',
	items: {
		type: 'object',
		properties: {
			_id: { type: 'string' },
			name: { type: 'string' },
			username: { type: 'string' },
			status: { type: 'string' },
			statusText: { type: 'string' },
			avatarETag: { type: 'string' },
		},
		required: ['_id', 'name', 'username', 'status'],
		additionalProperties: true,
	},
} as const;

const spotlightRoomsSchema = {
	type: 'array',
	items: {
		type: 'object',
		properties: {
			_id: { type: 'string' },
			t: { type: 'string' },
			name: { type: 'string' },
			fname: { type: 'string' },
			lastMessage: { $ref: '#/components/schemas/IMessage' },
		},
		required: ['_id', 't'],
		additionalProperties: true,
	},
} as const;

const spotlightResponseSchema = ajv.compile<{
	users: Pick<IUser, 'name' | 'status' | 'statusText' | 'avatarETag' | '_id' | 'username'>[];
	rooms: Pick<IRoom, 't' | 'name' | 'fname' | 'lastMessage' | '_id'>[];
}>({
	type: 'object',
	properties: {
		users: spotlightUsersSchema,
		rooms: spotlightRoomsSchema,
		success: { type: 'boolean', enum: [true] },
	},
	required: ['users', 'rooms', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'spotlight',
	{
		authRequired: true,
		query: isSpotlightProps,
		response: {
			200: spotlightResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { query } = this.queryParams;

		const result = await spotlightMethod({ text: query, userId: this.userId });

		return API.v1.success(result);
	},
);

const MAX_UNIFIED_SEARCH_RESULTS = 10;
const AI_SEARCH_PAGE_SIZE = 5;
const MAX_INTELLIGENT_SEARCH_RESULTS = 50;
const MAX_UNIFIED_SEARCH_FILTER_VALUES = 25;

const unifiedSearchResponseSchema = ajv.compile<{
	users: Pick<IUser, 'name' | 'status' | 'statusText' | 'avatarETag' | '_id' | 'username'>[];
	rooms: Pick<IRoom, 't' | 'name' | 'fname' | '_id'>[];
	messages: UnifiedSearchMessageResult[];
	intelligent: UnifiedSearchIntelligentResult[];
	meta: {
		globalMessagesEnabled: boolean;
		intelligentSearchEnabled: boolean;
		intelligentSearchConfigured: boolean;
		answerGenerationConfigured: boolean;
	};
}>({
	type: 'object',
	properties: {
		users: spotlightUsersSchema,
		rooms: spotlightRoomsSchema,
		messages: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					rid: { type: 'string' },
					msg: { type: 'string', nullable: true },
					u: { type: 'object', nullable: true },
					room: {
						type: 'object',
						nullable: true,
						properties: {
							_id: { type: 'string' },
							t: { type: 'string' },
							name: { type: 'string', nullable: true },
							fname: { type: 'string', nullable: true },
						},
						required: ['_id', 't'],
						additionalProperties: true,
					},
				},
				required: ['_id', 'rid'],
				additionalProperties: true,
			},
		},
		intelligent: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					rid: { type: 'string', nullable: true },
					msgId: { type: 'string', nullable: true },
					text: { type: 'string' },
					score: { type: 'number', nullable: true },
					room: {
						type: 'object',
						nullable: true,
						properties: {
							_id: { type: 'string' },
							t: { type: 'string' },
							name: { type: 'string', nullable: true },
							fname: { type: 'string', nullable: true },
						},
						required: ['_id', 't'],
						additionalProperties: true,
					},
				},
				required: ['_id', 'text'],
				additionalProperties: true,
			},
		},
		meta: {
			type: 'object',
			properties: {
				globalMessagesEnabled: { type: 'boolean' },
				intelligentSearchEnabled: { type: 'boolean' },
				intelligentSearchConfigured: { type: 'boolean' },
				answerGenerationConfigured: { type: 'boolean' },
			},
			required: ['globalMessagesEnabled', 'intelligentSearchEnabled', 'intelligentSearchConfigured', 'answerGenerationConfigured'],
			additionalProperties: false,
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['users', 'rooms', 'messages', 'intelligent', 'meta', 'success'],
	additionalProperties: false,
});

const parseCommaList = (value: string | undefined): string[] =>
	String(value ?? '')
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)
		.slice(0, MAX_UNIFIED_SEARCH_FILTER_VALUES);

const parseQueryBoolean = (value: unknown, defaultValue = false): boolean => {
	if (value === undefined || value === null) {
		return defaultValue;
	}

	return value === true || value === 'true';
};

const parseQueryDate = (value: string | undefined): Date | undefined => {
	if (!value) {
		return undefined;
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date;
};

const getRoomMap = async (roomIds: string[]): Promise<Map<string, Pick<IRoom, '_id' | 't' | 'name' | 'fname'>>> => {
	if (!roomIds.length) {
		return new Map();
	}

	const rooms = await Rooms.findByIds([...new Set(roomIds)], {
		projection: { _id: 1, t: 1, name: 1, fname: 1 },
	}).toArray();

	return new Map(rooms.map((room) => [room._id, room]));
};

API.v1.get(
	'search.unified',
	{
		authRequired: true,
		query: isUnifiedSearchProps,
		rateLimiterOptions: {
			numRequestsAllowed: 120,
			intervalTimeInMS: 60000,
		},
		response: {
			200: unifiedSearchResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const query = this.queryParams.query.trim();
		const { count } = await getPaginationItems(this.queryParams);
		const limit = Math.min(count || MAX_UNIFIED_SEARCH_RESULTS, MAX_UNIFIED_SEARCH_RESULTS);
		const requestedIntelligentCount = Number(this.queryParams.intelligentCount || AI_SEARCH_PAGE_SIZE);
		const intelligentLimit = Math.min(
			Math.max(Number.isFinite(requestedIntelligentCount) ? requestedIntelligentCount : AI_SEARCH_PAGE_SIZE, AI_SEARCH_PAGE_SIZE),
			MAX_INTELLIGENT_SEARCH_RESULTS,
		);
		const rid = this.queryParams.rid || undefined;
		const rids = parseCommaList(this.queryParams.rids);
		const roomNames = parseCommaList(this.queryParams.roomNames);
		const fromUsername = this.queryParams.fromUsername || undefined;
		const fromUsernames = parseCommaList(this.queryParams.fromUsernames);
		const startDate = parseQueryDate(this.queryParams.startDate);
		const endDate = parseQueryDate(this.queryParams.endDate);
		const includeSpotlight = parseQueryBoolean(this.queryParams.includeSpotlight, true);
		const includeMessages = parseQueryBoolean(this.queryParams.includeMessages);
		const includeIntelligent = parseQueryBoolean(this.queryParams.includeIntelligent);

		const hasFilters = Boolean(rid || rids.length || roomNames.length || fromUsername || fromUsernames.length || startDate || endDate);
		const filters = hasFilters ? { fromUsername, startDate, endDate } : undefined;

		const [spotlight, aiSearchStatus] = await Promise.all([
			// Don't run spotlight when filtering to a specific room (not useful)
			rid || !includeSpotlight
				? Promise.resolve({ users: [], rooms: [] })
				: spotlightMethod({
						text: query,
						userId: this.userId,
						type: { users: true, rooms: true, includeFederatedRooms: true },
					}),
			AISearch.status().catch((error) => {
				SystemLogger.warn({ msg: 'AI search status unavailable', err: error });
				return {
					hasIntelligentSearchLicense: false,
					intelligentSearchEnabled: false,
					intelligentSearchConfigured: false,
					answerGenerationConfigured: false,
				};
			}),
		]);

		const globalMessagesEnabled = settings.get('Search.defaultProvider.GlobalSearchEnabled') === true;

		let messages: UnifiedSearchMessageResult[] = [];
		// Room-specific search is always allowed; global search requires the setting
		if (includeMessages && (rid || globalMessagesEnabled)) {
			const searchResult = await messageSearch(this.userId, query, rid, limit, 0, filters);
			const docs = searchResult && searchResult.message ? await normalizeMessagesForUser(searchResult.message.docs, this.userId) : [];
			const rooms = await getRoomMap(docs.map((message: IMessage) => message.rid));
			messages = docs.map((message: IMessage) => ({
				_id: message._id,
				rid: message.rid,
				msg: message.msg,
				ts: message.ts,
				u: message.u,
				...(rooms.has(message.rid) && { room: rooms.get(message.rid) }),
			}));
		}

		let intelligent: UnifiedSearchIntelligentResult[] = [];
		if (
			includeIntelligent &&
			aiSearchStatus.hasIntelligentSearchLicense &&
			aiSearchStatus.intelligentSearchEnabled &&
			aiSearchStatus.intelligentSearchConfigured
		) {
			try {
				intelligent = await AISearch.search({
					query,
					userId: this.userId,
					filters: {
						rid,
						rids,
						roomNames,
						fromUsername,
						fromUsernames,
						startDate: startDate?.toISOString(),
						endDate: endDate?.toISOString(),
					},
					limit: intelligentLimit,
				});
			} catch (error) {
				SystemLogger.warn({
					msg: 'AI search request failed',
					err: error,
				});
			}
		} else {
			SystemLogger.debug({
				msg: 'AI search skipped at endpoint',
				includeIntelligent,
				hasIntelligentSearchLicense: aiSearchStatus.hasIntelligentSearchLicense,
				intelligentSearchEnabled: aiSearchStatus.intelligentSearchEnabled,
				intelligentSearchConfigured: aiSearchStatus.intelligentSearchConfigured,
			});
		}

		return API.v1.success({
			users: spotlight.users,
			rooms: spotlight.rooms,
			messages,
			intelligent,
			meta: {
				globalMessagesEnabled,
				intelligentSearchEnabled: aiSearchStatus.intelligentSearchEnabled,
				intelligentSearchConfigured: aiSearchStatus.intelligentSearchConfigured,
				answerGenerationConfigured: aiSearchStatus.answerGenerationConfigured,
			},
		});
	},
);

API.v1.get(
	'ai.llm.models',
	{
		authRequired: true,
		permissionsRequired: ['view-privileged-setting'],
		rateLimiterOptions: {
			numRequestsAllowed: 5,
			intervalTimeInMS: 60000,
		},
		response: {
			200: ajv.compile<{ data: { key: string; label: string }[] }>({
				type: 'object',
				properties: {
					data: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								key: { type: 'string' },
								label: { type: 'string' },
							},
							required: ['key', 'label'],
							additionalProperties: false,
						},
					},
					success: { type: 'boolean', enum: [true] },
				},
				required: ['data', 'success'],
				additionalProperties: false,
			}),
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		return API.v1.success({
			data: await AISearch.models(),
		});
	},
);

API.v1.post(
	'search.answer',
	{
		authRequired: true,
		body: isSearchAnswerProps,
		rateLimiterOptions: {
			numRequestsAllowed: 10,
			intervalTimeInMS: 60000,
		},
		response: {
			200: ajv.compile<{
				answer: string;
				provider: { name: string; model: string };
			}>({
				type: 'object',
				properties: {
					answer: { type: 'string' },
					provider: {
						type: 'object',
						properties: {
							name: { type: 'string' },
							model: { type: 'string' },
						},
						required: ['name', 'model'],
						additionalProperties: false,
					},
					success: { type: 'boolean', enum: [true] },
				},
				required: ['answer', 'provider', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { query, messages } = this.bodyParams;
		let answer;
		try {
			answer = await AISearch.answer({
				query,
				messages: messages.map(({ text, username, roomName, ts, score }) => ({
					text,
					username,
					roomName,
					ts,
					score,
				})),
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : '';
			if (message.includes('error-ai-not-enabled')) {
				throw new Meteor.Error('error-ai-not-enabled', 'AI Search is not enabled');
			}
			if (message.includes('error-ai-provider-not-configured')) {
				throw new Meteor.Error('error-ai-provider-not-configured', 'AI answer provider is not configured');
			}
			if (message.includes('error-ai-provider-empty-response')) {
				throw new Meteor.Error('error-ai-provider-empty-response', 'AI answer provider returned an empty response');
			}
			throw new Meteor.Error('error-ai-provider-request-failed', 'AI answer provider request failed');
		}

		return API.v1.success(answer);
	},
);

const directoryResponseSchema = ajv.compile<{
	result: (IDirectoryUserResult | IDirectoryChannelResult)[];
	count: number;
	offset: number;
	total: number;
}>({
	type: 'object',
	properties: {
		result: {
			type: 'array',
			items: {
				oneOf: [{ $ref: '#/components/schemas/IDirectoryUserResult' }, { $ref: '#/components/schemas/IDirectoryChannelResult' }],
			},
		},
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['result', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'directory',
	{
		authRequired: true,
		query: isDirectoryProps,
		response: {
			200: directoryResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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

		const user = await Users.findOneById(this.userId, { projection: { __rooms: 1 } });
		const result = await browseChannelsMethod(
			{
				...filter,
				sortBy,
				sortDirection,
				offset: Math.max(0, offset),
				limit: Math.max(0, count),
			},
			user,
		);

		if (!result) {
			return API.v1.failure('Please verify the parameters');
		}
		return API.v1.success({
			result: result.results as (IDirectoryUserResult | IDirectoryChannelResult)[],
			count: result.results.length,
			offset,
			total: result.total,
		});
	},
);

const pwGetPolicyResponseSchema = ajv.compile<{ enabled: boolean; policy: [string, Record<string, number | boolean>?][] }>({
	type: 'object',
	properties: {
		enabled: { type: 'boolean' },
		policy: { type: 'array', items: { type: 'array' } },
	},
	additionalProperties: true,
});

API.v1.get(
	'pw.getPolicy',
	{
		authRequired: false,
		response: {
			200: pwGetPolicyResponseSchema,
		},
	},
	function action() {
		return API.v1.success(passwordPolicy.getPasswordPolicy());
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

const methodCallResponseSchema = ajv.compile<{ message: string }>({
	type: 'object',
	properties: { message: { type: 'string' }, success: { type: 'boolean', enum: [true] } },
	required: ['message'],
	additionalProperties: false,
});

const methodCallErrorResponseSchema = ajv.compile<{ message: string }>({
	type: 'object',
	oneOf: [
		{
			properties: {
				message: { type: 'string' },
				success: { type: 'boolean', enum: [false] },
			},
			required: ['message', 'success'],
			additionalProperties: false,
		},
		{
			properties: {
				success: { type: 'boolean', enum: [false] },
				error: { type: 'string' },
				errorType: { type: 'string' },
				stack: { type: 'string' },
				details: { anyOf: [{ type: 'string' }, { type: 'object' }] },
			},
			required: ['success'],
			additionalProperties: false,
		},
	],
});

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
API.v1.post(
	'method.call/:method',
	{
		authRequired: true,
		userWithoutUsername: true,
		rateLimiterOptions: false,
		body: isMeteorCall,
		applyMeteorContext: true,
		response: {
			200: methodCallResponseSchema,
			400: methodCallErrorResponseSchema,
			401: validateUnauthorizedErrorResponse,
			429: ajv.compile({
				type: 'object',
				properties: { success: { type: 'boolean', enum: [false] }, error: { type: 'string' } },
				required: ['success'],
				additionalProperties: true,
			}),
		},
	},
	async function action() {
		check(this.bodyParams, {
			message: String,
		});

		const data = EJSON.parse(this.bodyParams.message);

		const { method, params, id } = data;

		const connectionId =
			this.token ||
			crypto
				.createHash('md5')
				.update((this.requestIp ?? '') + this.user._id)
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

			return API.v1.success(mountResult({ id, result: await Meteor.callAsync(method, ...params) }));
		} catch (err) {
			if (!(err as any).isClientSafe && !(err as any).meteorError) {
				SystemLogger.error({ msg: 'Exception while invoking method', err, method });
			}

			if (settings.get('Log_Level') === '2') {
				Meteor._debug(`Exception while invoking method ${method}`, err);
			}

			return API.v1.failure(mountResult({ id, error: err }));
		}
	},
);

API.v1.post(
	'method.callAnon/:method',
	{
		authRequired: false,
		userWithoutUsername: true,
		rateLimiterOptions: false,
		body: isMeteorCall,
		applyMeteorContext: true,
		response: {
			200: methodCallResponseSchema,
			400: methodCallErrorResponseSchema,
		},
	},
	async function action() {
		check(this.bodyParams, {
			message: String,
		});

		const data = EJSON.parse(this.bodyParams.message);

		const { method, params, id } = data;

		const connectionId =
			this.token ||
			crypto
				.createHash('md5')
				.update(this.requestIp ?? '')
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

			return API.v1.success(mountResult({ id, result: await Meteor.callAsync(method, ...params) }));
		} catch (err) {
			if (!(err as any).isClientSafe && !(err as any).meteorError) {
				SystemLogger.error({ msg: 'Exception while invoking method', err, method });
			}
			if (settings.get('Log_Level') === '2') {
				Meteor._debug(`Exception while invoking method ${method}`, err);
			}
			return API.v1.failure(mountResult({ id, error: err }));
		}
	},
);

const smtpCheckResponseSchema = ajv.compile<{ isSMTPConfigured: boolean }>({
	type: 'object',
	properties: {
		isSMTPConfigured: { type: 'boolean' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['isSMTPConfigured', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'smtp.check',
	{
		authRequired: true,
		response: {
			200: smtpCheckResponseSchema,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		return API.v1.success({ isSMTPConfigured: isSMTPConfigured() });
	},
);

const fingerprintResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

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
API.v1.post(
	'fingerprint',
	{
		authRequired: true,
		permissionsRequired: ['manage-cloud'],
		body: isFingerprintProps,
		response: {
			200: fingerprintResponseSchema,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			400: validateBadRequestErrorResponse,
		},
	},
	async function action() {
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
			username: this.user.username ?? '',
			ip: this.requestIp ?? '',
			useragent: this.request.headers.get('user-agent') ?? '',
		});

		const promises = settingsIds.map((settingId) => {
			if (settingId === 'uniqueID') {
				return auditSettingOperation(Settings.resetValueById, 'uniqueID', process.env.DEPLOYMENT_ID || crypto.randomUUID());
			}

			if (settingId === 'Cloud_Workspace_Access_Token_Expires_At') {
				return auditSettingOperation(Settings.resetValueById, 'Cloud_Workspace_Access_Token_Expires_At', new Date(0));
			}

			if (settingId === 'Deployment_FingerPrint_Verified') {
				return auditSettingOperation(Settings.updateValueById, 'Deployment_FingerPrint_Verified', true);
			}

			return resetAuditedSettingByUser({
				_id: this.userId,
				username: this.user.username ?? '',
				ip: this.requestIp ?? '',
				useragent: this.request.headers.get('user-agent') ?? '',
			})(Settings.resetValueById, settingId);
		});

		(await Promise.all(promises)).forEach((value, index) => {
			if (value?.modifiedCount) {
				void notifyOnSettingChangedById(settingsIds[index]);
			}
		});

		return API.v1.success();
	},
);
