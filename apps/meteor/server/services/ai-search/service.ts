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
	AISearchStatus,
	IAISearchService,
} from '@rocket.chat/core-services';
import { License, ServiceClass } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Messages, Rooms, Subscriptions, Users } from '@rocket.chat/models';
import type { UnifiedSearchIntelligentResult } from '@rocket.chat/rest-typings';
import { serverFetch, type ExtendedFetchOptions } from '@rocket.chat/server-fetch';

import { settings } from '../../../app/settings/server';

const logger = new Logger('AISearchService');

const DEFAULT_ANSWER_SYSTEM_PROMPT = [
	"Given below user's query and the search results, provide a concise and accurate answer to the query based on the search results. Make sure to include relevant caveats and context. Add references to the search results in the format [N] after the relevant information. If you are unsure about the answer, say that you are not sure instead of making something up.",
	"For formatting the answer, use markdown. For code snippets, use markdown code blocks with the appropriate language specified. Keep the answers as concise as possible, while still providing a complete answer to the user's question, and everything in a single column, without using tables or other formatting that may be hard to read in the Rocket.Chat client.",
].join('\n');

const fetchWithSsrfValidation = (url: string, options: Omit<ExtendedFetchOptions, 'allowList' | 'ignoreSsrfValidation'>) =>
	serverFetch(url, { ...options, ignoreSsrfValidation: false, allowList: [] });

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

	private async getUserSubscribedRoomIdsForPipeline(userId: string): Promise<string[]> {
		return Subscriptions.findByUserId(userId, {
			projection: { rid: 1 },
		})
			.map(({ rid }) => rid)
			.toArray();
	}

	private async getSubscribedRoomIdSet(userId: string, roomIds: string[]): Promise<Set<string>> {
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
	}

	private async normalizeIntelligentResults(
		rawSearchResults: unknown,
		userId: string,
		prefilterRoomIds: string[] = [],
		limit = AI_SEARCH_PAGE_SIZE,
		candidateLimit = limit,
	): Promise<UnifiedSearchIntelligentResult[]> {
		const candidates = normalizeIntelligentSearchCandidates(rawSearchResults, prefilterRoomIds, candidateLimit, logger);
		const msgIds = candidates.map(({ msgId }) => msgId).filter((msgId): msgId is string => Boolean(msgId));
		const messageMap = new Map<string, IMessage>();

		if (msgIds.length > 0) {
			const msgs = await Messages.findVisibleByIds(msgIds, {
				projection: { _id: 1, rid: 1, msg: 1, ts: 1, u: 1 },
			}).toArray();
			for (const message of msgs) {
				messageMap.set(String(message._id), message);
			}
			logger.debug({ msg: 'AI search messages fetched from DB', requested: msgIds.length, found: messageMap.size });
		}

		const rooms = await this.getRoomMap([
			...candidates.map(({ rid }) => rid).filter((rid): rid is string => Boolean(rid)),
			...Array.from(messageMap.values()).map(({ rid }) => rid),
		]);
		const subscribedRoomIds = await this.getSubscribedRoomIdSet(userId, [
			...candidates.map(({ rid }) => rid).filter((rid): rid is string => Boolean(rid)),
			...Array.from(messageMap.values()).map(({ rid }) => rid),
		]);

		return candidates
			.flatMap((result) => {
				const dbMessage = result.msgId ? messageMap.get(result.msgId) : undefined;
				if (result.msgId && !dbMessage) {
					logger.debug({ msg: 'AI search result filtered: message not visible', msgId: result.msgId });
					return [];
				}

				const rid = dbMessage?.rid || result.rid;
				if (!rid || !subscribedRoomIds.has(rid)) {
					return [];
				}

				return [
					{
						_id: result.msgId || result._id,
						rid,
						msgId: result.msgId,
						text: dbMessage?.msg || result.pipelineText || '',
						ts: dbMessage?.ts?.toISOString(),
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
	}): Promise<UnifiedSearchIntelligentResult[]> {
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
		const subscribedScopedRoomIds = scopedRoomIds.length ? await this.getSubscribedRoomIds(userId, scopedRoomIds) : [];
		const pipelineRoomIds = scopedRoomIds.length ? subscribedScopedRoomIds : await this.getUserSubscribedRoomIdsForPipeline(userId);

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

		const classifications = await this.getUserClassifications(userId);
		const json = await searchIntelligentPipeline({
			query,
			config,
			classifications,
			pipelineFilters,
			limit,
			fetch: fetchWithSsrfValidation,
			logger,
		});

		return this.normalizeIntelligentResults(json, userId, pipelineRoomIds, limit, limit);
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

		const systemPrompt = asString(systemPromptSetting) || DEFAULT_ANSWER_SYSTEM_PROMPT;

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
