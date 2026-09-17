import { MAX_AI_SERVICE_RESPONSE_SIZE } from './constants';
import type {
	AIServiceFetch,
	AIServiceLogger,
	IntelligentSearchCandidate,
	IntelligentSearchFilters,
	IntelligentSearchPipelineFilters,
	IntelligentSearchPipelineRequest,
} from './types';
import { getErrorType } from './utils';

const buildEndpointUrl = (baseUrl: string, path: string): string =>
	new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const asRecord = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

const firstString = (...values: unknown[]): string | undefined => {
	for (const value of values) {
		if (typeof value === 'string' && value) {
			return value;
		}
	}
	return undefined;
};

const firstNumber = (...values: unknown[]): number | undefined => {
	for (const value of values) {
		if (typeof value !== 'number' && typeof value !== 'string') {
			continue;
		}
		if (typeof value === 'string' && !value.trim()) {
			continue;
		}

		const numberValue = Number(value);
		if (Number.isFinite(numberValue)) {
			return numberValue;
		}
	}
	return undefined;
};

export const normalizeSimilarityPercent = (value: unknown): number => {
	const numeric = Number(value);

	if (!Number.isFinite(numeric)) {
		return 0;
	}

	return Math.min(100, Math.max(0, Math.floor(numeric)));
};

export const getSemanticDistanceThreshold = (minimumSimilarityPercent: number): number =>
	Number((1 - minimumSimilarityPercent / 100).toFixed(4));

// pipeline contract: `score`/`distance` are cosine distances (lower is better, similarity = 1 - distance)
const normalizePipelineSimilarityScore = (value: number, type: 'distance' | 'similarity'): number => {
	const normalizedValue = Math.abs(value) > 1 ? value / 100 : value;
	const similarity = type === 'distance' ? 1 - normalizedValue : normalizedValue;

	return Math.min(1, Math.max(0, similarity));
};

const extractPipelineSimilarityScore = (result: Record<string, unknown>, metadata: Record<string, unknown>): number | undefined => {
	const similarity = firstNumber(result.similarity, metadata.similarity);
	if (typeof similarity === 'number') {
		return normalizePipelineSimilarityScore(similarity, 'similarity');
	}

	const distance = firstNumber(result.score, result.distance, metadata.score, metadata.distance);
	if (typeof distance === 'number') {
		return normalizePipelineSimilarityScore(distance, 'distance');
	}

	return undefined;
};

const extractIntelligentResultIds = (result: Record<string, unknown>): { rid?: string; msgId?: string } => {
	const metadata = asRecord(result.metadata);
	let rid = firstString(metadata.room_id, metadata.rid, result.room_id, result.rid);
	let msgId = firstString(metadata.msg_id, metadata.message_id, result.msg_id, result.message_id, result.id);
	const externalIdentifier = firstString(result.external_identifier);

	if ((!rid || !msgId) && externalIdentifier) {
		const separator = externalIdentifier.indexOf(':');
		if (separator > 0 && separator < externalIdentifier.length - 1) {
			rid = rid || externalIdentifier.slice(0, separator);
			msgId = msgId || externalIdentifier.slice(separator + 1);
		} else {
			msgId = msgId || externalIdentifier;
		}
	}

	return { rid, msgId };
};

export const normalizeIntelligentSearchCandidates = (
	rawSearchResults: unknown,
	userRoomIds: string[] = [],
	limit: number,
	logger?: AIServiceLogger,
): IntelligentSearchCandidate[] => {
	let rawResults: unknown[] = [];
	const rawSearchResultsRecord = asRecord(rawSearchResults);

	if (Array.isArray(rawSearchResults)) {
		rawResults = rawSearchResults;
	} else if (Array.isArray(rawSearchResultsRecord.results)) {
		rawResults = rawSearchResultsRecord.results;
	} else if (Array.isArray(rawSearchResultsRecord.context)) {
		rawResults = rawSearchResultsRecord.context;
	} else if (Array.isArray(rawSearchResultsRecord.documents)) {
		rawResults = rawSearchResultsRecord.documents;
	} else if (Array.isArray(rawSearchResultsRecord.hits)) {
		rawResults = rawSearchResultsRecord.hits;
	} else if (Array.isArray(rawSearchResultsRecord.data)) {
		rawResults = rawSearchResultsRecord.data;
	}

	logger?.debug?.({
		msg: 'Intelligent search normalizing results',
		rawCount: rawResults.length,
		rawKeys: Object.keys(rawSearchResultsRecord),
	});

	const userRoomIdSet = new Set(userRoomIds);
	const shouldFilterByRoomIds = userRoomIdSet.size > 0;

	const candidates: IntelligentSearchCandidate[] = [];
	for (let index = 0; index < rawResults.length && candidates.length < limit; index++) {
		const result = asRecord(rawResults[index]);
		const metadata = asRecord(result.metadata);
		const { rid, msgId } = extractIntelligentResultIds(result);
		if (!msgId && !rid) {
			continue;
		}
		if (shouldFilterByRoomIds && rid && !userRoomIdSet.has(rid)) {
			logger?.debug?.({ msg: 'Intelligent search result filtered: room not in user subscriptions', rid });
			continue;
		}

		const score = extractPipelineSimilarityScore(result, metadata);
		candidates.push({
			_id: msgId || `intelligent-${index}`,
			rid,
			msgId,
			pipelineText: firstString(result.text, result.content, result.document, result.page_content, metadata.text) || '',
			...(typeof score === 'number' && { score }),
		});
	}

	logger?.debug?.({ msg: 'Intelligent search after filter', candidateCount: candidates.length });

	return candidates;
};

export const buildIntelligentSearchPipelineFilters = (
	userRoomIds: string[],
	{ rid, rids, fromUsername, fromUsernames, startDate, endDate }: Omit<IntelligentSearchFilters, 'roomNames'>,
): IntelligentSearchPipelineFilters | undefined => {
	if (!userRoomIds.length) {
		return undefined;
	}

	const requestedRoomIdSet = new Set(rids);
	if (rid) {
		requestedRoomIdSet.add(rid);
	}
	const requestedRoomIds = [...requestedRoomIdSet];
	let subscribedRoomIds = userRoomIds;
	if (requestedRoomIds.length) {
		const matchedRoomIds = new Set<string>();
		for (const roomId of userRoomIds) {
			if (requestedRoomIdSet.has(roomId)) {
				matchedRoomIds.add(roomId);
				if (matchedRoomIds.size === requestedRoomIdSet.size) {
					break;
				}
			}
		}
		subscribedRoomIds = requestedRoomIds.filter((roomId) => matchedRoomIds.has(roomId));
	}
	const filters: IntelligentSearchPipelineFilters = {};

	if (requestedRoomIds.length && !subscribedRoomIds.length) {
		return undefined;
	}

	filters.room_id = subscribedRoomIds.length === 1 ? { $eq: subscribedRoomIds[0] } : { $in: subscribedRoomIds };

	const usernameSet = new Set<string>();
	for (const username of fromUsernames || []) {
		const normalizedUsername = username.replace(/^@/, '');
		if (normalizedUsername) {
			usernameSet.add(normalizedUsername);
		}
	}
	if (fromUsername) {
		const normalizedUsername = fromUsername.replace(/^@/, '');
		if (normalizedUsername) {
			usernameSet.add(normalizedUsername);
		}
	}
	const usernames = [...usernameSet];
	if (usernames.length === 1) {
		filters.username = { $eq: usernames[0] };
	} else if (usernames.length > 1) {
		filters.username = { $in: usernames };
	}

	if (startDate || endDate) {
		filters.timestamp = {
			...(startDate && { $ge: startDate.toISOString() }),
			...(endDate && { $le: endDate.toISOString() }),
		};
	}

	return filters;
};

export const searchIntelligentPipeline = async ({
	query,
	config,
	classifications,
	pipelineFilters,
	limit,
	fetch,
	logger,
}: IntelligentSearchPipelineRequest): Promise<unknown> => {
	const minimumSimilarity = normalizeSimilarityPercent(config.minimumSimilarityPercent);
	const formattedQuery = config.queryTemplate ? config.queryTemplate.replace('{query}', query) : query;
	const url = buildEndpointUrl(config.baseUrl, `pipelines/${encodeURIComponent(config.pipelineId)}/search`);

	logger?.debug?.({
		msg: 'Intelligent search request',
		url,
		queryLength: formattedQuery.length,
		hasQueryTemplate: Boolean(config.queryTemplate),
		filterKeys: Object.keys(pipelineFilters),
		classificationCount: classifications.length,
		threshold: getSemanticDistanceThreshold(minimumSimilarity),
	});

	let response: Awaited<ReturnType<AIServiceFetch>>;
	try {
		response = await fetch(url, {
			method: 'POST',
			timeout: 10000,
			size: MAX_AI_SERVICE_RESPONSE_SIZE,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'X-API-KEY': config.apiKey,
				'X-API-KEY-SECRET': config.apiKeySecret,
			},
			body: JSON.stringify({
				query: formattedQuery,
				type: 'similarity',
				classification: {
					classifications,
					search_type: 2,
				},
				filters: pipelineFilters,
				params: {
					k: limit,
					threshold: getSemanticDistanceThreshold(minimumSimilarity),
				},
			}),
		});
	} catch (fetchError: unknown) {
		logger?.warn?.({ msg: 'Intelligent search fetch failed', url, errorType: getErrorType(fetchError) });
		throw fetchError;
	}

	if (!response.ok) {
		const body = await response.text().catch(() => '');
		logger?.warn?.({ msg: 'Intelligent search pipeline returned error', url, status: response.status, bodyLength: body.length });
		return [];
	}

	const json = await response.json();
	logger?.debug?.({ msg: 'Intelligent search raw response received', resultKeys: Object.keys(asRecord(json)) });
	return json;
};
