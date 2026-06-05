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
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Messages, Rooms, Subscriptions, Users } from '@rocket.chat/models';
import type { UnifiedSearchIntelligentResult } from '@rocket.chat/rest-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { SystemLogger } from '../../lib/logger/system';

const AI_SEARCH_PAGE_SIZE = 5;
const MAX_SEARCH_ANSWER_MESSAGES = 12;
const MAX_SEARCH_ANSWER_TEXT_LENGTH = 1600;
const MAX_SEARCH_FILTER_VALUES = 25;

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
		const [hasIntelligentSearchLicense, intelligentSearchEnabled, pipelineConfig, answerProviderConfig] = await Promise.all([
			License.hasModule('chat.rocket.rc-ai'),
			Settings.get<boolean>('AI_Intelligent_Search_Enabled'),
			this.getPipelineConfig(),
			this.getAnswerProviderConfig(),
		]);

		return {
			hasIntelligentSearchLicense,
			intelligentSearchEnabled: intelligentSearchEnabled === true,
			intelligentSearchConfigured: Boolean(pipelineConfig),
			answerGenerationConfigured: Boolean(answerProviderConfig),
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

	private async getUserRoomIds(userId: string): Promise<string[]> {
		return (
			await Subscriptions.findByUserId(userId, {
				projection: { rid: 1 },
			}).toArray()
		).map((subscription) => subscription.rid);
	}

	private async normalizeIntelligentResults(
		rawSearchResults: unknown,
		userRoomIds: string[],
		limit = AI_SEARCH_PAGE_SIZE,
	): Promise<UnifiedSearchIntelligentResult[]> {
		const candidates = normalizeIntelligentSearchCandidates(rawSearchResults, userRoomIds, limit, SystemLogger);
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
		const userRoomIdSet = new Set(userRoomIds);

		return candidates.flatMap((result) => {
			const dbMessage = result.msgId ? messageMap.get(result.msgId) : undefined;
			const rid = dbMessage?.rid || result.rid;
			if (!rid || !userRoomIdSet.has(rid)) {
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
		});
	}

	private async getUserClassifications(userId: string): Promise<string[]> {
		const user = await Users.findOneById<Pick<IUser, 'roles'>>(userId, { projection: { roles: 1 } });
		return Array.from(new Set(['user', ...(user?.roles || [])]));
	}

	private async getAccessibleRoomIdsByName(userRoomIds: string[], roomNames: string[] = []): Promise<string[]> {
		if (!roomNames.length) {
			return [];
		}

		const accessibleRoomIds = new Set(userRoomIds);
		const rooms = await Promise.all(
			Array.from(new Set(roomNames)).map((roomName) => Rooms.findOneByNameOrFname(roomName, { projection: { _id: 1 } })),
		);

		return rooms.map((room) => room?._id).filter((roomId): roomId is string => Boolean(roomId && accessibleRoomIds.has(roomId)));
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
		const [hasIntelligentSearchLicense, intelligentSearchEnabled, config, userRoomIds] = await Promise.all([
			License.hasModule('chat.rocket.rc-ai'),
			Settings.get<boolean>('AI_Intelligent_Search_Enabled'),
			this.getPipelineConfig(),
			this.getUserRoomIds(userId),
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

		if (!userRoomIds.length) {
			SystemLogger.debug({ msg: 'AI search skipped: user has no room subscriptions' });
			return [];
		}

		const filters = normalizeFilters(rawFilters);
		const roomNameIds = await this.getAccessibleRoomIdsByName(userRoomIds, filters.roomNames);
		const pipelineFilters = buildIntelligentSearchPipelineFilters(userRoomIds, {
			...filters,
			rids: [...(filters.rids || []), ...roomNameIds],
		});

		if (!pipelineFilters) {
			SystemLogger.debug({ msg: 'AI search skipped: no accessible rooms for filters', rid: filters.rid });
			return [];
		}

		const classifications = await this.getUserClassifications(userId);
		const json = await searchIntelligentPipeline({
			query,
			config,
			classifications,
			pipelineFilters,
			limit,
			fetch: aiServiceFetch,
			logger: SystemLogger,
		});

		return this.normalizeIntelligentResults(json, userRoomIds, limit);
	}

	async answer({ query, messages }: { query: string; messages: AISearchAnswerMessage[] }): Promise<AISearchAnswerResult> {
		const [hasIntelligentSearchLicense, intelligentSearchEnabled, pipelineConfig, provider, systemPromptSetting] = await Promise.all([
			License.hasModule('chat.rocket.rc-ai'),
			Settings.get<boolean>('AI_Intelligent_Search_Enabled'),
			this.getPipelineConfig(),
			this.getAnswerProviderConfig(),
			Settings.get<string>('AI_Intelligent_Search_Answer_System_Prompt'),
		]);

		if (!hasIntelligentSearchLicense || intelligentSearchEnabled !== true || !pipelineConfig) {
			throw new Error('error-ai-not-enabled');
		}

		if (!provider) {
			throw new Error('error-ai-provider-not-configured');
		}

		const systemPrompt =
			asString(systemPromptSetting) ||
			'You are an assistant that summarizes Rocket.Chat search results into a concise answer with relevant caveats.';

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
