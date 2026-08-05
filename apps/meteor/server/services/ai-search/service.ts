import {
	AI_LICENSE_MODULE,
	AI_SEARCH_PAGE_SIZE,
	buildIntelligentSearchPipelineFilters,
	generateOpenAICompatibleSearchAnswer,
	listOpenAICompatibleModels,
	MAX_SEARCH_ANSWER_MESSAGES,
	MAX_SEARCH_ANSWER_TEXT_LENGTH,
	MAX_SEARCH_FILTER_VALUES,
	normalizeIntelligentSearchCandidates,
	searchIntelligentPipeline,
	type IntelligentSearchFilters,
	type IntelligentSearchPipelineConfig,
	type OpenAICompatibleProviderConfig,
	type SearchAnswerMessage,
} from '@rocket.chat/ai-search';
import type {
	AISearchAnswerMessage,
	AISearchAnswerResult,
	AISearchFilters,
	AISearchModelOption,
	AISearchResult,
	AISearchStatus,
	IAISearchService,
} from '@rocket.chat/core-services';
import { License, ServiceClass } from '@rocket.chat/core-services';
import { isBannedSubscription, type IMessage, type IRoom, type IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Messages, Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { serverFetch, type ExtendedFetchOptions } from '@rocket.chat/server-fetch';

import { settings } from '../../settings';

const logger = new Logger('AISearchService');

const fetchWithSsrfValidation = (url: string, options: Omit<ExtendedFetchOptions, 'allowList' | 'ignoreSsrfValidation'>) =>
	serverFetch(url, {
		...options,
		ignoreSsrfValidation: false,
		allowList: settings.get<string>('SSRF_Allowlist'),
	});

const asString = (value: unknown): string => {
	if (typeof value === 'string') {
		return value;
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	return '';
};

const toDate = (value?: string | Date): Date | undefined => {
	if (!value) {
		return undefined;
	}

	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date;
};

const limitFilterValues = (values: string[] | undefined): string[] | undefined => {
	if (!values) {
		return undefined;
	}

	const limitedValues: string[] = [];
	for (const value of values) {
		if (value) {
			limitedValues.push(value);
			if (limitedValues.length === MAX_SEARCH_FILTER_VALUES) {
				break;
			}
		}
	}
	return limitedValues;
};

const normalizeFilters = (filters: AISearchFilters = {}): IntelligentSearchFilters => ({
	rid: filters.rid,
	rids: limitFilterValues(filters.rids),
	roomNames: limitFilterValues(filters.roomNames),
	fromUsername: filters.fromUsername,
	fromUsernames: limitFilterValues(filters.fromUsernames),
	startDate: toDate(filters.startDate),
	endDate: toDate(filters.endDate),
});

type OpenAICompatibleProviderSettings = Pick<OpenAICompatibleProviderConfig, 'baseUrl' | 'apiKey'> & {
	model?: string;
};

export class AISearchService extends ServiceClass implements IAISearchService {
	protected name = 'ai-search';

	private getPipelineConfig(): IntelligentSearchPipelineConfig | undefined {
		const baseUrl = settings.get<string>('AI_Intelligent_Search_Pipeline_Base_URL');
		const pipelineId = settings.get<string>('AI_Intelligent_Search_Pipeline_ID');
		const apiKey = settings.get<string>('AI_Intelligent_Search_API_Key');
		const apiKeySecret = settings.get<string>('AI_Intelligent_Search_API_Key_Secret');
		const queryTemplate = settings.get<string>('AI_Intelligent_Search_Query_Template');
		const minimumSimilarityPercent = settings.get<number>('AI_Intelligent_Search_Min_Similarity_Percent');

		const normalizedBaseUrl = asString(baseUrl);
		const normalizedPipelineId = asString(pipelineId);
		const normalizedApiKey = asString(apiKey);
		const normalizedApiKeySecret = asString(apiKeySecret);

		if (!normalizedBaseUrl || !normalizedPipelineId || !normalizedApiKey || !normalizedApiKeySecret) {
			return undefined;
		}

		return {
			baseUrl: normalizedBaseUrl,
			pipelineId: normalizedPipelineId,
			apiKey: normalizedApiKey,
			apiKeySecret: normalizedApiKeySecret,
			queryTemplate: asString(queryTemplate),
			minimumSimilarityPercent: Number(minimumSimilarityPercent || 0),
		};
	}

	private getAnswerProviderSettings(): OpenAICompatibleProviderSettings | undefined {
		const baseUrl = settings.get<string>('AI_LLM_OpenAI_Base_URL');
		const apiKey = settings.get<string>('AI_LLM_OpenAI_API_Key');
		const model = settings.get<string>('AI_LLM_OpenAI_Model');

		const normalizedBaseUrl = asString(baseUrl);
		const normalizedApiKey = asString(apiKey);
		const normalizedModel = asString(model);

		if (!normalizedBaseUrl || !normalizedApiKey) {
			return undefined;
		}

		return {
			baseUrl: normalizedBaseUrl,
			apiKey: normalizedApiKey,
			model: normalizedModel,
		};
	}

	private getAnswerProviderConfig(): OpenAICompatibleProviderConfig | undefined {
		const provider = this.getAnswerProviderSettings();
		if (!provider?.model) {
			return undefined;
		}

		return {
			name: 'OpenAI compatible',
			baseUrl: provider.baseUrl,
			apiKey: provider.apiKey,
			model: provider.model,
		};
	}

	async status(): Promise<AISearchStatus> {
		const hasIntelligentSearchLicense = await License.hasModule(AI_LICENSE_MODULE);
		const intelligentSearchEnabled = settings.get<boolean>('AI_Intelligent_Search_Enabled');
		const answerGenerationEnabled = settings.get<boolean>('AI_Intelligent_Search_Answer_Enabled');
		const pipelineConfig = this.getPipelineConfig();
		const answerProviderConfig = this.getAnswerProviderConfig();

		return {
			hasIntelligentSearchLicense,
			intelligentSearchEnabled: intelligentSearchEnabled === true,
			intelligentSearchConfigured: Boolean(pipelineConfig),
			answerGenerationConfigured: answerGenerationEnabled === true && Boolean(answerProviderConfig) && Boolean(pipelineConfig),
		};
	}

	private async getRoomMap(roomIds: string[]): Promise<Map<string, Pick<IRoom, '_id' | 't' | 'name' | 'fname'>>> {
		if (!roomIds.length) {
			return new Map();
		}

		const rooms = await Rooms.findByIds([...new Set(roomIds)], {
			projection: { _id: 1, t: 1, name: 1, fname: 1 },
		}).toArray();

		return new Map(rooms.map((room) => [room._id, room]));
	}

	private async getUserSubscribedRoomIdsForPipeline(userId: string): Promise<string[]> {
		const roomIds = await Subscriptions.findByUserId(userId, {
			projection: { rid: 1, status: 1 },
		})
			.map((subscription) => (isBannedSubscription(subscription) ? undefined : subscription.rid))
			.toArray();

		return roomIds.filter((rid): rid is string => Boolean(rid));
	}

	private async getSubscribedRoomIdSet(userId: string, roomIds: string[]): Promise<Set<string>> {
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
	}

	private async normalizeIntelligentResults(
		rawSearchResults: unknown,
		userId: string,
		limit = AI_SEARCH_PAGE_SIZE,
	): Promise<AISearchResult[]> {
		const candidates = normalizeIntelligentSearchCandidates(rawSearchResults, [], limit, logger);
		const msgIdSet = new Set<string>();
		for (const { msgId } of candidates) {
			if (msgId) {
				msgIdSet.add(msgId);
			}
		}
		const msgIds = [...msgIdSet];
		let messageMap = new Map<string, Pick<IMessage, '_id' | 'rid' | 'msg' | 'ts' | 'u'>>();

		if (msgIds.length > 0) {
			messageMap = new Map(
				await Messages.findVisibleByIds(msgIds, {
					projection: { _id: 1, rid: 1, msg: 1, ts: 1, u: 1 },
				})
					.map((message) => [String(message._id), message] as const)
					.toArray(),
			);
			logger.debug({ msg: 'AI search messages fetched from DB', requested: msgIds.length, found: messageMap.size });
		}

		const resultRoomIds = Array.from(messageMap.values(), ({ rid }) => rid);
		const [rooms, subscribedRoomIds] = await Promise.all([
			this.getRoomMap(resultRoomIds),
			this.getSubscribedRoomIdSet(userId, resultRoomIds),
		]);

		const normalizedResults: AISearchResult[] = [];
		for (const result of candidates) {
			// candidates without a visible database message could surface stale pipeline text
			const dbMessage = result.msgId ? messageMap.get(result.msgId) : undefined;
			if (!dbMessage) {
				logger.debug({ msg: 'AI search result filtered: message not visible', msgId: result.msgId });
				continue;
			}

			const { rid } = dbMessage;
			if (!rid || !subscribedRoomIds.has(rid)) {
				continue;
			}

			const room = rooms.get(rid);
			normalizedResults.push({
				_id: result.msgId || result._id,
				rid,
				msgId: result.msgId,
				text: dbMessage.msg || '',
				ts: dbMessage.ts?.toISOString(),
				u: dbMessage.u ? { username: dbMessage.u.username, name: dbMessage.u.name } : undefined,
				...(Number.isFinite(result.score) && { score: result.score }),
				...(room && { room }),
			});
			if (normalizedResults.length === limit) {
				break;
			}
		}

		return normalizedResults;
	}

	private async getUserClassifications(userId: string): Promise<string[]> {
		const user = await Users.findOneById<Pick<IUser, 'roles'>>(userId, { projection: { roles: 1 } });
		return Array.from(new Set(['user', ...(user?.roles || [])]));
	}

	private async getSubscribedRoomIds(userId: string, roomIds: string[]): Promise<string[]> {
		return [...(await this.getSubscribedRoomIdSet(userId, roomIds))];
	}

	private async getSubscribedRoomIdsByName(userId: string, roomNames: string[] = []): Promise<string[]> {
		if (!roomNames.length) {
			return [];
		}

		const rooms = await Promise.all(
			Array.from(new Set(roomNames)).map((roomName) => Rooms.findOneByNameOrFname(roomName, { projection: { _id: 1 } })),
		);

		const roomIds = rooms.reduce<string[]>((roomIds, room) => {
			if (typeof room?._id === 'string') {
				roomIds.push(room._id);
			}

			return roomIds;
		}, []);

		return this.getSubscribedRoomIds(userId, roomIds);
	}

	async search({
		query,
		userId,
		filters: rawFilters,
		limit = AI_SEARCH_PAGE_SIZE,
	}: {
		query: string;
		userId: string;
		filters?: AISearchFilters;
		limit?: number;
	}): Promise<AISearchResult[]> {
		const hasIntelligentSearchLicense = await License.hasModule(AI_LICENSE_MODULE);
		const intelligentSearchEnabled = settings.get<boolean>('AI_Intelligent_Search_Enabled');
		const config = this.getPipelineConfig();

		if (!hasIntelligentSearchLicense || intelligentSearchEnabled !== true || !config) {
			logger.debug({
				msg: 'AI search skipped: unavailable',
				hasIntelligentSearchLicense,
				intelligentSearchEnabled: intelligentSearchEnabled === true,
				intelligentSearchConfigured: Boolean(config),
			});
			return [];
		}

		const filters = normalizeFilters(rawFilters);
		const requestedRoomIds = [...new Set([...(filters.rids || []), ...(filters.rid ? [filters.rid] : [])])];
		const roomNameIds = await this.getSubscribedRoomIdsByName(userId, filters.roomNames);
		const scopedRoomIds = [...new Set([...requestedRoomIds, ...roomNameIds])];

		// a room filter that resolves to no subscribed rooms must not fall through to the unscoped path
		if (filters.roomNames?.length && !scopedRoomIds.length) {
			logger.debug({ msg: 'AI search skipped: room name filters did not resolve to subscribed rooms' });
			return [];
		}
		const [pipelineRoomIds, classifications] = await Promise.all([
			scopedRoomIds.length ? this.getSubscribedRoomIds(userId, scopedRoomIds) : this.getUserSubscribedRoomIdsForPipeline(userId),
			this.getUserClassifications(userId),
		]);

		if (!pipelineRoomIds.length) {
			logger.debug({ msg: 'AI search skipped: user has no room subscriptions' });
			return [];
		}

		const pipelineFilters = buildIntelligentSearchPipelineFilters(pipelineRoomIds, {
			...filters,
			rids: [...(filters.rids || []), ...roomNameIds],
		});

		if (!pipelineFilters) {
			logger.debug({ msg: 'AI search skipped: no subscribed rooms for filters', rid: filters.rid });
			return [];
		}

		const json = await searchIntelligentPipeline({
			query,
			config,
			classifications,
			pipelineFilters,
			limit,
			fetch: fetchWithSsrfValidation,
			logger,
		});

		return this.normalizeIntelligentResults(json, userId, limit);
	}

	async answer({ query, messages }: { query: string; messages: AISearchAnswerMessage[] }): Promise<AISearchAnswerResult> {
		const hasIntelligentSearchLicense = await License.hasModule(AI_LICENSE_MODULE);
		const intelligentSearchEnabled = settings.get<boolean>('AI_Intelligent_Search_Enabled');
		const answerGenerationEnabled = settings.get<boolean>('AI_Intelligent_Search_Answer_Enabled');
		const pipelineConfig = this.getPipelineConfig();
		const provider = this.getAnswerProviderConfig();
		const systemPromptSetting = settings.get<string>('AI_Intelligent_Search_Answer_System_Prompt');

		if (!hasIntelligentSearchLicense || intelligentSearchEnabled !== true || answerGenerationEnabled !== true || !pipelineConfig) {
			throw new Error('error-ai-not-enabled');
		}

		if (!provider) {
			throw new Error('error-ai-provider-not-configured');
		}

		const systemPrompt = asString(systemPromptSetting);

		const sanitizedMessages: SearchAnswerMessage[] = messages.map(({ text, username, roomName, ts, score }) => ({
			text,
			username,
			roomName,
			ts,
			score,
		}));

		return generateOpenAICompatibleSearchAnswer({
			query,
			messages: sanitizedMessages,
			provider,
			systemPrompt,
			fetch: fetchWithSsrfValidation,
			logger,
			maxMessages: MAX_SEARCH_ANSWER_MESSAGES,
			maxTextLength: MAX_SEARCH_ANSWER_TEXT_LENGTH,
		});
	}

	async models(): Promise<AISearchModelOption[]> {
		if (!(await License.hasModule(AI_LICENSE_MODULE))) {
			return [];
		}

		const provider = this.getAnswerProviderSettings();
		const selectedModel = settings.get<string>('AI_LLM_OpenAI_Model');

		return listOpenAICompatibleModels({
			provider,
			selectedModel: asString(selectedModel),
			fetch: fetchWithSsrfValidation,
			logger,
		});
	}
}
