export const AI_LICENSE_MODULE = 'chat.rocket.rc-ai';

export const AI_SEARCH_PAGE_SIZE = 5;
export const AI_SEARCH_RESULTS_PAGE_SIZE = 8;
export const AI_SEARCH_FILTER_SUGGESTION_LIMIT = 5;
export const AI_SEARCH_ROOM_LOOKUP_LIMIT = 20;
export const MAX_INTELLIGENT_SEARCH_RESULTS = 50;
// Candidate pool retrieved from each retriever before fusion. Implementation detail, never exposed to
// admins. The floor of 50 is where offline nDCG@10 peaked: 20 starves fusion, 100 dilutes conceptual
// queries with weak neighbours. See docs/features/ai-search-hybrid-benchmark.md.
export const INTELLIGENT_SEARCH_CANDIDATE_MULTIPLIER = 3;
export const MIN_INTELLIGENT_SEARCH_CANDIDATES = 50;
export const MAX_INTELLIGENT_SEARCH_CANDIDATES = 100;
export const INTELLIGENT_SEARCH_RRF_CONSTANT = 60;
export const DEFAULT_INTELLIGENT_SEARCH_SEMANTIC_WEIGHT = 50;
export const DEFAULT_INTELLIGENT_SEARCH_RECENCY_HALF_LIFE_DAYS = 30;
export const MAX_SEARCH_FILTER_VALUES = 25;
export const MAX_ROOM_SEARCH_PATTERN_LENGTH = 64;
export const MAX_AI_SERVICE_RESPONSE_SIZE = 5 * 1024 * 1024;
export const MAX_SOURCE_MESSAGE_LENGTH = 700;
export const MAX_SEARCH_ANSWER_MESSAGES = 20;
export const MAX_SEARCH_ANSWER_TEXT_LENGTH = 1600;
