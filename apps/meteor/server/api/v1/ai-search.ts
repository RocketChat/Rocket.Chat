import { AI_SEARCH_PAGE_SIZE, MAX_INTELLIGENT_SEARCH_RESULTS, MAX_SEARCH_FILTER_VALUES } from '@rocket.chat/ai-search';
import { AISearch } from '@rocket.chat/core-services';
import { isBannedSubscription, type IRoom } from '@rocket.chat/core-typings';
import { Messages, Rooms, Subscriptions } from '@rocket.chat/models';
import {
	ajv,
	isSearchAnswerProps,
	isAISearchProps,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import type { AISearchResult, SearchAnswer } from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { getSettingPermissionId } from '../../../app/authorization/lib';
import { hasAllPermissionAsync, hasAtLeastOnePermissionAsync } from '../../lib/authorization/hasPermission';
import { normalizeMessagesForUser } from '../../lib/utils/lib/normalizeMessagesForUser';
import { API } from '../api';

const aiSearchResponseSchema = ajv.compile<{
	intelligent: AISearchResult[];
	meta: {
		intelligentSearchEnabled: boolean;
		intelligentSearchConfigured: boolean;
		answerGenerationConfigured: boolean;
	};
}>({
	type: 'object',
	properties: {
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
				intelligentSearchEnabled: { type: 'boolean' },
				intelligentSearchConfigured: { type: 'boolean' },
				answerGenerationConfigured: { type: 'boolean' },
			},
			required: ['intelligentSearchEnabled', 'intelligentSearchConfigured', 'answerGenerationConfigured'],
			additionalProperties: false,
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['intelligent', 'meta', 'success'],
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

const parseCommaList = (value: string | undefined): string[] => {
	if (!value) {
		return [];
	}

	const items: string[] = [];
	for (const item of value.split(',')) {
		const normalizedItem = item.trim();
		if (normalizedItem) {
			items.push(normalizedItem);
			if (items.length === MAX_SEARCH_FILTER_VALUES) {
				break;
			}
		}
	}
	return items;
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
	const uniqueRoomIdSet = new Set<string>();
	for (const roomId of roomIds) {
		if (roomId) {
			uniqueRoomIdSet.add(roomId);
		}
	}
	const uniqueRoomIds = [...uniqueRoomIdSet];
	if (!uniqueRoomIds.length) {
		return new Set();
	}

	const subscriptions = await Subscriptions.findByUserIdAndRoomIds(userId, uniqueRoomIds, {
		projection: { rid: 1, status: 1 },
	}).toArray();

	const subscribedRoomIds = new Set<string>();
	for (const subscription of subscriptions) {
		if (!isBannedSubscription(subscription)) {
			subscribedRoomIds.add(subscription.rid);
		}
	}
	return subscribedRoomIds;
};

const getSearchAnswerMessagesForUser = async (userId: string, messages: SearchAnswer['messages']) => {
	const messageIds: string[] = [];
	const messageIdSet = new Set<string>();
	const scoreByMessageId = new Map<string, number | undefined>();
	const clampScore = (score: number | undefined): number | undefined =>
		typeof score === 'number' && Number.isFinite(score) ? Math.min(1, Math.max(0, score)) : undefined;
	for (const { _id, score } of messages) {
		if (!_id) {
			continue;
		}
		if (!messageIdSet.has(_id)) {
			messageIdSet.add(_id);
			messageIds.push(_id);
		}
		scoreByMessageId.set(_id, clampScore(score));
	}
	if (!messageIds.length) {
		throw new Meteor.Error('error-invalid-search-answer-sources');
	}

	const docs = await Messages.findVisibleByIds(messageIds, {
		projection: { _id: 1, rid: 1, msg: 1, ts: 1, u: 1 },
	}).toArray();
	const subscribedRoomIds = await getSubscribedRoomIds(
		userId,
		docs.map((message) => message.rid),
	);
	if (docs.length !== messageIds.length || docs.some((message) => !subscribedRoomIds.has(message.rid))) {
		throw new Meteor.Error('error-invalid-search-answer-sources');
	}

	const normalizedDocs = await normalizeMessagesForUser(docs, userId);
	const docsById = new Map(normalizedDocs.map((message) => [message._id, message]));
	const rooms = await getRoomMap(normalizedDocs.map((message) => message.rid));

	const answerMessages = [];
	for (const messageId of messageIds) {
		const message = docsById.get(messageId);
		if (message?.msg) {
			const score = scoreByMessageId.get(message._id);
			const room = rooms.get(message.rid);
			answerMessages.push({
				text: message.msg,
				username: message.u?.username,
				roomName: room?.fname || room?.name,
				ts: message.ts?.toISOString(),
				...(Number.isFinite(score) && { score }),
			});
		}
	}

	if (!answerMessages.length) {
		throw new Meteor.Error('error-invalid-search-answer-sources');
	}

	return answerMessages;
};

API.v1.get(
	'ai.search',
	{
		authRequired: true,
		query: isAISearchProps,
		rateLimiterOptions: {
			numRequestsAllowed: 120,
			intervalTimeInMS: 60000,
		},
		response: {
			200: aiSearchResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const query = this.queryParams.query.trim();
		const requestedIntelligentCount = this.queryParams.intelligentCount ?? AI_SEARCH_PAGE_SIZE;
		const intelligentLimit = Math.min(Math.max(Math.floor(requestedIntelligentCount), 1), MAX_INTELLIGENT_SEARCH_RESULTS);
		const rid = this.queryParams.rid || undefined;
		const rids = parseCommaList(this.queryParams.rids);
		const roomNames = parseCommaList(this.queryParams.roomNames);
		const fromUsername = this.queryParams.fromUsername || undefined;
		const fromUsernames = parseCommaList(this.queryParams.fromUsernames);
		const startDate = parseQueryDate(this.queryParams.startDate);
		const endDate = parseQueryDate(this.queryParams.endDate);
		const aiSearchStatus = await AISearch.status().catch((error) => {
			this.logger.warn({ msg: 'AI search status unavailable', err: error });

			return {
				hasIntelligentSearchLicense: false,
				intelligentSearchEnabled: false,
				intelligentSearchConfigured: false,
				answerGenerationConfigured: false,
			};
		});
		let intelligentResults: AISearchResult[] = [];
		if (
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
			} catch (error) {
				this.logger.warn({ msg: 'AI search request failed', err: error });
				intelligentResults = [];
			}
		}

		return API.v1.success({
			intelligent: intelligentResults,
			meta: {
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
		rateLimiterOptions: {
			numRequestsAllowed: 5,
			intervalTimeInMS: 60000,
		},
		response: {
			200: aiModelsResponseSchema,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const canAccessAllSettings = await hasAtLeastOnePermissionAsync(this.userId, ['view-privileged-setting', 'edit-privileged-setting']);
		const canAccessModelSetting =
			canAccessAllSettings ||
			(await hasAllPermissionAsync(this.userId, ['manage-selected-settings', getSettingPermissionId('AI_LLM_OpenAI_Model')]));

		if (!canAccessModelSetting) {
			return API.v1.forbidden();
		}

		return API.v1.success({
			data: await AISearch.models(),
		});
	},
);

API.v1.post(
	'ai.search.answer',
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

		// gate before any DB work so users cannot drive message lookups for an unlicensed feature
		const aiSearchStatus = await AISearch.status();
		if (
			!aiSearchStatus.hasIntelligentSearchLicense ||
			!aiSearchStatus.intelligentSearchEnabled ||
			!aiSearchStatus.answerGenerationConfigured
		) {
			throw new Meteor.Error('error-ai-not-enabled');
		}

		const answerMessages = await getSearchAnswerMessagesForUser(this.userId, messages);
		try {
			const answer = await AISearch.answer({
				query,
				messages: answerMessages,
			});

			return API.v1.success(answer);
		} catch (error) {
			const message = error instanceof Error ? error.message : '';
			if (message === 'error-ai-not-enabled') {
				throw new Meteor.Error('error-ai-not-enabled');
			}
			if (message === 'error-ai-provider-not-configured') {
				throw new Meteor.Error('error-ai-provider-not-configured');
			}
			if (message === 'error-ai-provider-empty-response') {
				throw new Meteor.Error('error-ai-provider-empty-response');
			}
			throw new Meteor.Error('error-ai-provider-request-failed');
		}
	},
);
