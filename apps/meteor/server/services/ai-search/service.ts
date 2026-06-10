import {
	buildIntelligentSearchPipelineFilters,
	generateOpenAICompatibleSearchAnswer,
	listOpenAICompatibleModels,
	normalizeIntelligentSearchCandidates,
	searchIntelligentPipeline,
	type AIServiceFetch,
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
	AISearchStatus,
	IAISearchService,
} from '@rocket.chat/core-services';
import { License, ServiceClass, Settings } from '@rocket.chat/core-services';
import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { Messages, Rooms, Subscriptions, Users } from '@rocket.chat/models';
import type { UnifiedSearchIntelligentResult } from '@rocket.chat/rest-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { SystemLogger } from '../../lib/logger/system';

const AI_SEARCH_PAGE_SIZE = 5;
const MAX_SEARCH_ANSWER_MESSAGES = 12;
const MAX_SEARCH_ANSWER_TEXT_LENGTH = 1600;
const MAX_SEARCH_FILTER_VALUES = 25;
const MAX_PIPELINE_ROOM_FILTER_VALUES = 1000;
const PIPELINE_ROOM_PREFETCH_LIMIT = MAX_PIPELINE_ROOM_FILTER_VALUES + 1;
const MAX_UNSCOPED_PIPELINE_RESULTS = 100;

const aiServiceFetch: AIServiceFetch = (url, options) => fetch(url, options as Parameters<typeof fetch>[1]);

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

const limitFilterValues = (values: string[] | undefined): string[] | undefined =>
	values?.filter(Boolean).slice(0, MAX_SEARCH_FILTER_VALUES);

const normalizeFilters = (filters: AISearchFilters = {}): IntelligentSearchFilters => ({
	rid: filters.rid,
	rids: limitFilterValues(filters.rids),
	roomNames: limitFilterValues(filters.roomNames),
	fromUsername: filters.fromUsername,
	fromUsernames: limitFilterValues(filters.fromUsernames),
	startDate: toDate(filters.startDate),
	endDate: toDate(filters.endDate),
});

export class AISearchService extends ServiceClass implements IAISearchService {
	protected name = 'ai-search';

	private async getPipelineConfig(): Promise<IntelligentSearchPipelineConfig | undefined> {
		const [baseUrl, pipelineId, apiKey, apiKeySecret, queryTemplate, minimumSimilarityPercent] = await Promise.all([
			Settings.get<string>('AI_Intelligent_Search_Pipeline_Base_URL'),
			Settings.get<string>('AI_Intelligent_Search_Pipeline_ID'),
			Settings.get<string>('AI_Intelligent_Search_API_Key'),
			Settings.get<string>('AI_Intelligent_Search_API_Key_Secret'),
			Settings.get<string>('AI_Intelligent_Search_Query_Template'),
			Settings.get<number>('AI_Intelligent_Search_Min_Similarity_Percent'),
		]);

		const normalizedBaseUrl = asString(baseUrl).replace(/\/+$/, '');
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

	private async getAnswerProviderConfig(): Promise<OpenAICompatibleProviderConfig | undefined> {
		const [baseUrl, apiKey, model] = await Promise.all([
			Settings.get<string>('AI_LLM_OpenAI_Base_URL'),
			Settings.get<string>('AI_LLM_OpenAI_API_Key'),
			Settings.get<string>('AI_LLM_OpenAI_Model'),
		]);

		const normalizedBaseUrl = asString(baseUrl).replace(/\/+$/, '');
		const normalizedApiKey = asString(apiKey);
		const normalizedModel = asString(model);

		if (!normalizedBaseUrl || !normalizedApiKey || !normalizedModel) {
			return undefined;
		}

		return {
			name: 'OpenAI compatible',
			baseUrl: normalizedBaseUrl,
			apiKey: normalizedApiKey,
			model: normalizedModel,
		};
	}

	async status(): Promise<AISearchStatus> {
		const [hasIntelligentSearchLicense, intelligentSearchEnabled, answerGenerationEnabled, pipelineConfig, answerProviderConfig] =
			await Promise.all([
				License.hasModule('chat.rocket.rc-ai'),
				Settings.get<boolean>('AI_Intelligent_Search_Enabled'),
				Settings.get<boolean>('AI_Intelligent_Search_Answer_Enabled'),
				this.getPipelineConfig(),
				this.getAnswerProviderConfig(),
			]);

		return {
			hasIntelligentSearchLicense,
			intelligentSearchEnabled: intelligentSearchEnabled === true,
			intelligentSearchConfigured: Boolean(pipelineConfig),
			answerGenerationConfigured: answerGenerationEnabled === true && Boolean(answerProviderConfig),
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

	private async getUserRoomIdsForPipeline(userId: string): Promise<{ roomIds: string[]; isComplete: boolean }> {
		const subscriptions = await Subscriptions.findByUserId(userId, {
			projection: { rid: 1 },
			limit: PIPELINE_ROOM_PREFETCH_LIMIT,
		}).toArray();

		return {
			roomIds: subscriptions.map(({ rid }: Pick<ISubscription, 'rid'>) => rid),
			isComplete: subscriptions.length < PIPELINE_ROOM_PREFETCH_LIMIT,
		};
	}

	private async getAccessibleRoomIdSet(userId: string, roomIds: string[]): Promise<Set<string>> {
		const uniqueRoomIds = [...new Set(roomIds)].filter(Boolean);
		if (!uniqueRoomIds.length) {
			return new Set();
		}

		const subscriptions = await Subscriptions.findByUserIdAndRoomIds(userId, uniqueRoomIds, {
			projection: { rid: 1 },
		}).toArray();

		return new Set(subscriptions.map(({ rid }) => rid));
	}

	private async normalizeIntelligentResults(
		rawSearchResults: unknown,
		userId: string,
		prefilterRoomIds: string[] = [],
		limit = AI_SEARCH_PAGE_SIZE,
		candidateLimit = limit,
	): Promise<UnifiedSearchIntelligentResult[]> {
		const candidates = normalizeIntelligentSearchCandidates(rawSearchResults, prefilterRoomIds, candidateLimit, SystemLogger);
		const msgIds = candidates.map(({ msgId }) => msgId).filter((msgId): msgId is string => Boolean(msgId));
		const messageMap = new Map<string, IMessage>();

		if (msgIds.length > 0) {
			const msgs = await Messages.findVisibleByIds(msgIds, {
				projection: { _id: 1, rid: 1, msg: 1, ts: 1, u: 1 },
			}).toArray();
			for (const message of msgs) {
				messageMap.set(String(message._id), message);
			}
			SystemLogger.debug({ msg: 'AI search messages fetched from DB', requested: msgIds.length, found: messageMap.size });
		}

		const rooms = await this.getRoomMap([
			...candidates.map(({ rid }) => rid).filter((rid): rid is string => Boolean(rid)),
			...Array.from(messageMap.values()).map(({ rid }) => rid),
		]);
		const accessibleRoomIds = await this.getAccessibleRoomIdSet(userId, [
			...candidates.map(({ rid }) => rid).filter((rid): rid is string => Boolean(rid)),
			...Array.from(messageMap.values()).map(({ rid }) => rid),
		]);

		return candidates
			.flatMap((result) => {
				const dbMessage = result.msgId ? messageMap.get(result.msgId) : undefined;
				const rid = dbMessage?.rid || result.rid;
				if (!rid || !accessibleRoomIds.has(rid)) {
					return [];
				}

				return [
					{
						_id: result.msgId || result._id,
						rid,
						msgId: result.msgId,
						text: dbMessage?.msg || result.pipelineText || '',
						ts: dbMessage?.ts,
						u: dbMessage?.u ? { username: dbMessage.u.username, name: dbMessage.u.name } : undefined,
						...(Number.isFinite(result.score) && { score: result.score }),
						...(rid && rooms.has(rid) && { room: rooms.get(rid) }),
					},
				];
			})
			.slice(0, limit);
	}

	private async getUserClassifications(userId: string): Promise<string[]> {
		const user = await Users.findOneById<Pick<IUser, 'roles'>>(userId, { projection: { roles: 1 } });
		return Array.from(new Set(['user', ...(user?.roles || [])]));
	}

	private async getAccessibleRoomIds(userId: string, roomIds: string[]): Promise<string[]> {
		return [...(await this.getAccessibleRoomIdSet(userId, roomIds))];
	}

	private async getAccessibleRoomIdsByName(userId: string, roomNames: string[] = []): Promise<string[]> {
		if (!roomNames.length) {
			return [];
		}

		const rooms = await Promise.all(
			Array.from(new Set(roomNames)).map((roomName) => Rooms.findOneByNameOrFname(roomName, { projection: { _id: 1 } })),
		);

		return this.getAccessibleRoomIds(
			userId,
			rooms.map((room) => room?._id).filter((roomId): roomId is string => Boolean(roomId)),
		);
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
	}): Promise<UnifiedSearchIntelligentResult[]> {
		const [hasIntelligentSearchLicense, intelligentSearchEnabled, config] = await Promise.all([
			License.hasModule('chat.rocket.rc-ai'),
			Settings.get<boolean>('AI_Intelligent_Search_Enabled'),
			this.getPipelineConfig(),
		]);

		if (!hasIntelligentSearchLicense || intelligentSearchEnabled !== true || !config) {
			SystemLogger.debug({
				msg: 'AI search skipped: unavailable',
				hasIntelligentSearchLicense,
				intelligentSearchEnabled: intelligentSearchEnabled === true,
				intelligentSearchConfigured: Boolean(config),
			});
			return [];
		}

		const filters = normalizeFilters(rawFilters);
		const requestedRoomIds = [...new Set([...(filters.rids || []), ...(filters.rid ? [filters.rid] : [])])];
		const roomNameIds = await this.getAccessibleRoomIdsByName(userId, filters.roomNames);
		const scopedRoomIds = [...new Set([...requestedRoomIds, ...roomNameIds])];
		const accessibleScopedRoomIds = scopedRoomIds.length ? await this.getAccessibleRoomIds(userId, scopedRoomIds) : [];
		const pipelineRoomScope = scopedRoomIds.length
			? { roomIds: accessibleScopedRoomIds, isComplete: true }
			: await this.getUserRoomIdsForPipeline(userId);

		if (!pipelineRoomScope.roomIds.length) {
			SystemLogger.debug({ msg: 'AI search skipped: user has no room subscriptions' });
			return [];
		}

		const pipelineFilters = buildIntelligentSearchPipelineFilters(pipelineRoomScope.roomIds, {
			...filters,
			rids: [...(filters.rids || []), ...roomNameIds],
		});

		if (!pipelineFilters) {
			SystemLogger.debug({ msg: 'AI search skipped: no accessible rooms for filters', rid: filters.rid });
			return [];
		}

		const classifications = await this.getUserClassifications(userId);
		const pipelineLimit = pipelineRoomScope.isComplete ? limit : Math.min(Math.max(limit * 10, 50), MAX_UNSCOPED_PIPELINE_RESULTS);
		const json = await searchIntelligentPipeline({
			query,
			config,
			classifications,
			pipelineFilters,
			limit: pipelineLimit,
			fetch: aiServiceFetch,
			logger: SystemLogger,
		});

		return this.normalizeIntelligentResults(
			json,
			userId,
			pipelineRoomScope.isComplete ? pipelineRoomScope.roomIds : [],
			limit,
			pipelineLimit,
		);
	}

	async answer({ query, messages }: { query: string; messages: AISearchAnswerMessage[] }): Promise<AISearchAnswerResult> {
		const [hasIntelligentSearchLicense, intelligentSearchEnabled, answerGenerationEnabled, pipelineConfig, provider, systemPromptSetting] =
			await Promise.all([
				License.hasModule('chat.rocket.rc-ai'),
				Settings.get<boolean>('AI_Intelligent_Search_Enabled'),
				Settings.get<boolean>('AI_Intelligent_Search_Answer_Enabled'),
				this.getPipelineConfig(),
				this.getAnswerProviderConfig(),
				Settings.get<string>('AI_Intelligent_Search_Answer_System_Prompt'),
			]);

		if (!hasIntelligentSearchLicense || intelligentSearchEnabled !== true || answerGenerationEnabled !== true || !pipelineConfig) {
			throw new Error('error-ai-not-enabled');
		}

		if (!provider) {
			throw new Error('error-ai-provider-not-configured');
		}

		const systemPrompt =
			asString(systemPromptSetting) ||
			`
			Given below user's query and the search results, provide a concise and accurate answer to the query based on the search results. Make sure to include relevant caveats and context. Add references to the search results in the format [N] after the relevant information. If you are unsure about the answer, say that you are not sure instead of making something up.
			For formatting the answer, use markdown. For code snippets, use markdown code blocks with the appropriate language specified. Keep the answers as concise as possible, while still providing a complete answer to the user's question, and everything in a single column, without using tables or other formatting that may be hard to read in the Rocket.Chat client.
			`;

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
			fetch: aiServiceFetch,
			logger: SystemLogger,
			maxMessages: MAX_SEARCH_ANSWER_MESSAGES,
			maxTextLength: MAX_SEARCH_ANSWER_TEXT_LENGTH,
		});
	}

	async models(): Promise<AISearchModelOption[]> {
		const [baseUrl, apiKey, selectedModel] = await Promise.all([
			Settings.get<string>('AI_LLM_OpenAI_Base_URL'),
			Settings.get<string>('AI_LLM_OpenAI_API_Key'),
			Settings.get<string>('AI_LLM_OpenAI_Model'),
		]);

		return listOpenAICompatibleModels({
			provider: {
				baseUrl: asString(baseUrl).replace(/\/+$/, ''),
				apiKey: asString(apiKey),
			},
			selectedModel: asString(selectedModel),
			fetch: aiServiceFetch,
			logger: SystemLogger,
		});
	}
}
