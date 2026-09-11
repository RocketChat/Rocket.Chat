export type AIServiceFetchResponse = {
	ok: boolean;
	status: number;
	json(): Promise<unknown>;
	text(): Promise<string>;
};

export type AIServiceFetch = (
	url: string,
	options: {
		method: string;
		timeout?: number;
		size?: number;
		headers?: Record<string, string>;
		body?: string;
	},
) => Promise<AIServiceFetchResponse>;

export type AIServiceLogger = {
	debug?(payload: Record<string, unknown>): void;
	warn?(payload: Record<string, unknown>): void;
};

export type OpenAICompatibleProviderConfig = {
	name: string;
	baseUrl: string;
	apiKey: string;
	model: string;
};

export type SearchAnswerMessage = {
	text: string;
	username?: string;
	roomName?: string;
	ts?: string;
	score?: number;
};

export type SearchAnswerResult = {
	answer: string;
	provider: Pick<OpenAICompatibleProviderConfig, 'name' | 'model'>;
};

export type IntelligentSearchPipelineConfig = {
	baseUrl: string;
	pipelineId: string;
	apiKey: string;
	apiKeySecret: string;
	queryTemplate?: string;
	minimumSimilarityPercent?: number;
};

export type IntelligentSearchType = 'semantic' | 'keyword' | 'hybrid';

export type IntelligentSearchCandidateSource = 'semantic' | 'keyword';

export type IntelligentSearchCandidate = {
	_id: string;
	rid?: string;
	msgId?: string;
	pipelineText: string;
	/** Normalized cosine similarity. Unset for keyword candidates, which have no comparable score. */
	score?: number;
	semanticSimilarity?: number;
	semanticDistance?: number;
	source?: IntelligentSearchCandidateSource;
	ts?: string;
};

export type FusedIntelligentSearchCandidate = IntelligentSearchCandidate & {
	rrfScore: number;
	semanticRank?: number;
	fulltextRank?: number;
};

export type TemporalRerankOptions = {
	/** 0 disables the boost, 100 doubles the freshest candidate's score */
	recencyWeight: number;
	halfLifeDays: number;
	now?: Date;
};

export type IntelligentSearchFilters = {
	rid?: string;
	rids?: string[];
	roomNames?: string[];
	fromUsername?: string;
	fromUsernames?: string[];
	startDate?: Date;
	endDate?: Date;
};

export type IntelligentSearchPipelineFilters = Record<string, unknown>;

export type IntelligentSearchPipelineRequest = {
	query: string;
	config: IntelligentSearchPipelineConfig;
	classifications: string[];
	pipelineFilters: IntelligentSearchPipelineFilters;
	limit: number;
	fetch: AIServiceFetch;
	logger?: AIServiceLogger;
	/** a single request targets one retriever; `hybrid` is resolved before reaching this layer */
	mode?: IntelligentSearchCandidateSource;
};
