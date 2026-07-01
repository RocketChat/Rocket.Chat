import {
	AI_SEARCH_PAGE_SIZE,
	MAX_INTELLIGENT_SEARCH_RESULTS,
	MAX_SEARCH_FILTER_VALUES,
	MAX_UNIFIED_SEARCH_RESULTS,
} from '@rocket.chat/ai-search';
import { AISearch } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Messages, Rooms, Subscriptions } from '@rocket.chat/models';
import {
	ajv,
	isSearchAnswerProps,
	isUnifiedSearchProps,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import type { SearchAnswer, UnifiedSearchIntelligentResult, UnifiedSearchMessageResult } from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { messageSearch } from '../../../../server/methods/messageSearch';
import { spotlightMethod } from '../../../../server/publications/spotlight';
import { settings } from '../../../settings/server';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

const searchUsersSchema = {
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

const searchRoomsSchema = {
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
		users: searchUsersSchema,
		rooms: searchRoomsSchema,
		messages: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					rid: { type: 'string' },
					msg: { type: 'string' },
					u: { type: 'object' },
					room: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							t: { type: 'string' },
							name: { type: 'string' },
							fname: { type: 'string' },
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
					rid: { type: 'string' },
					msgId: { type: 'string' },
					text: { type: 'string' },
					score: { type: 'number' },
					room: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							t: { type: 'string' },
							name: { type: 'string' },
							fname: { type: 'string' },
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

const aiModelsResponseSchema = ajv.compile<{ data: { key: string; label: string }[] }>({
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
});

const searchAnswerResponseSchema = ajv.compile<{
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
});

const parseCommaList = (value: string | undefined): string[] =>
	String(value ?? '')
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)
		.slice(0, MAX_SEARCH_FILTER_VALUES);

const parseQueryBoolean = (value: unknown, defaultValue = false): boolean => {
	if (value === undefined || value === null) {
		return defaultValue;
	}

	return value === true || value === 'true';
};

const parseQueryDate = (value: string | undefined): Date | undefined => (value ? new Date(value) : undefined);

const getRoomMap = async (roomIds: string[]): Promise<Map<string, Pick<IRoom, '_id' | 't' | 'name' | 'fname'>>> => {
	if (!roomIds.length) {
		return new Map();
	}

	const rooms = await Rooms.findByIds([...new Set(roomIds)], {
		projection: { _id: 1, t: 1, name: 1, fname: 1 },
	}).toArray();

	return new Map(rooms.map((room) => [room._id, room]));
};

const getSubscribedRoomIds = async (userId: string, roomIds: string[]): Promise<Set<string>> => {
	const uniqueRoomIds = [...new Set(roomIds)].filter(Boolean);
	if (!uniqueRoomIds.length) {
		return new Set();
	}

	const subscribedRoomIds = await Subscriptions.findByUserIdAndRoomIds(userId, uniqueRoomIds, {
		projection: { rid: 1 },
	})
		.map(({ rid }) => rid)
		.toArray();

	return new Set(subscribedRoomIds);
};

const getSearchAnswerMessagesForUser = async (userId: string, messages: SearchAnswer['messages']) => {
	const messageIds = [...new Set(messages.map(({ _id }) => _id).filter(Boolean))];
	if (!messageIds.length) {
		throw new Meteor.Error('error-invalid-search-answer-sources');
	}

	const clampScore = (score: number | undefined): number | undefined =>
		typeof score === 'number' && Number.isFinite(score) ? Math.min(1, Math.max(0, score)) : undefined;
	const scoreByMessageId = new Map(messages.map(({ _id, score }) => [_id, clampScore(score)]));
	const docs = await Messages.findVisibleByIds(messageIds, {
		projection: { _id: 1, rid: 1, msg: 1, ts: 1, u: 1 },
	}).toArray();
	const subscribedRoomIds = await getSubscribedRoomIds(
		userId,
		docs.map((message) => message.rid),
	);
	const subscribedDocs = docs.filter((message) => subscribedRoomIds.has(message.rid));
	if (docs.length !== messageIds.length || subscribedDocs.length !== docs.length) {
		throw new Meteor.Error('error-invalid-search-answer-sources');
	}

	const normalizedDocs = await normalizeMessagesForUser(subscribedDocs, userId);
	const docsById = new Map(normalizedDocs.map((message: IMessage) => [message._id, message]));
	const rooms = await getRoomMap(normalizedDocs.map((message: IMessage) => message.rid));

	const answerMessages = messageIds
		.map((messageId) => docsById.get(messageId))
		.filter((message): message is IMessage => Boolean(message?.msg))
		.map((message) => {
			const room = rooms.get(message.rid);
			const score = scoreByMessageId.get(message._id);

			return {
				text: message.msg,
				username: message.u?.username,
				roomName: room?.fname || room?.name,
				ts: message.ts?.toISOString(),
				...(Number.isFinite(score) && { score }),
			};
		});

	if (!answerMessages.length) {
		throw new Meteor.Error('error-invalid-search-answer-sources');
	}

	return answerMessages;
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
		const globalMessagesEnabled = settings.get('Search.defaultProvider.GlobalSearchEnabled') === true;

		if (!includeSpotlight && !includeMessages && !includeIntelligent) {
			const aiSearchStatus = await AISearch.status().catch(() => ({
				hasIntelligentSearchLicense: false,
				intelligentSearchEnabled: false,
				intelligentSearchConfigured: false,
				answerGenerationConfigured: false,
			}));

			return API.v1.success({
				users: [],
				rooms: [],
				messages: [],
				intelligent: [],
				meta: {
					globalMessagesEnabled,
					intelligentSearchEnabled: aiSearchStatus.intelligentSearchEnabled,
					intelligentSearchConfigured: aiSearchStatus.intelligentSearchConfigured,
					answerGenerationConfigured: aiSearchStatus.answerGenerationConfigured,
				},
			});
		}

		const hasFilters = Boolean(rid || rids.length || roomNames.length || fromUsername || fromUsernames.length || startDate || endDate);
		const filters = hasFilters
			? {
					rids,
					roomNames,
					fromUsername,
					fromUsernames,
					startDate,
					endDate,
				}
			: undefined;

		const [spotlight, aiSearchStatus] = await Promise.all([
			rid || !includeSpotlight
				? Promise.resolve({ users: [], rooms: [] })
				: spotlightMethod({
						text: query,
						userId: this.userId,
						type: { users: true, rooms: true, includeFederatedRooms: true },
					}),
			AISearch.status().catch(() => ({
				hasIntelligentSearchLicense: false,
				intelligentSearchEnabled: false,
				intelligentSearchConfigured: false,
				answerGenerationConfigured: false,
			})),
		]);

		let messages: UnifiedSearchMessageResult[] = [];
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

		let intelligentResults: UnifiedSearchIntelligentResult[] = [];
		if (
			includeIntelligent &&
			aiSearchStatus.hasIntelligentSearchLicense &&
			aiSearchStatus.intelligentSearchEnabled &&
			aiSearchStatus.intelligentSearchConfigured
		) {
			try {
				intelligentResults = await AISearch.search({
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
			} catch {
				intelligentResults = [];
			}
		}

		return API.v1.success({
			users: spotlight.users,
			rooms: spotlight.rooms,
			messages,
			intelligent: intelligentResults,
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
			200: aiModelsResponseSchema,
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
			200: searchAnswerResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { query, messages } = this.bodyParams;

		// Gate on feature availability before doing any DB work so a user cannot drive message
		// lookups for a feature their workspace has not licensed or enabled.
		const aiSearchStatus = await AISearch.status();
		if (
			!aiSearchStatus.hasIntelligentSearchLicense ||
			!aiSearchStatus.intelligentSearchEnabled ||
			!aiSearchStatus.answerGenerationConfigured
		) {
			throw new Meteor.Error('error-ai-not-enabled');
		}

		const answerMessages = await getSearchAnswerMessagesForUser(this.userId, messages);
		let answer;
		try {
			answer = await AISearch.answer({
				query,
				messages: answerMessages,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : '';
			if (message.includes('error-ai-not-enabled')) {
				throw new Meteor.Error('error-ai-not-enabled');
			}
			if (message.includes('error-ai-provider-not-configured')) {
				throw new Meteor.Error('error-ai-provider-not-configured');
			}
			if (message.includes('error-ai-provider-empty-response')) {
				throw new Meteor.Error('error-ai-provider-empty-response');
			}
			throw new Meteor.Error('error-ai-provider-request-failed');
		}

		return API.v1.success(answer);
	},
);
