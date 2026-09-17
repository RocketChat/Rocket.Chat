import type { IRoom } from '@rocket.chat/core-typings';

import { ajv, ajvQuery } from './Ajv';

type AISearch = {
	query: string;
	intelligentCount?: number;
	rid?: string;
	rids?: string;
	roomNames?: string;
	fromUsername?: string;
	fromUsernames?: string;
	startDate?: string;
	endDate?: string;
};

const AISearchSchema = {
	type: 'object',
	properties: {
		query: { type: 'string', minLength: 1, pattern: '\\S', maxLength: 500 },
		intelligentCount: { type: 'number' },
		rid: { type: 'string', maxLength: 256 },
		rids: { type: 'string', maxLength: 4096 },
		roomNames: { type: 'string', maxLength: 4096 },
		fromUsername: { type: 'string', maxLength: 256 },
		fromUsernames: { type: 'string', maxLength: 4096 },
		startDate: {
			anyOf: [
				{ type: 'string', maxLength: 0 },
				{ type: 'string', format: 'date' },
				{ type: 'string', format: 'date-time' },
			],
		},
		endDate: {
			anyOf: [
				{ type: 'string', maxLength: 0 },
				{ type: 'string', format: 'date' },
				{ type: 'string', format: 'date-time' },
			],
		},
	},
	required: ['query'],
	additionalProperties: false,
};

export const isAISearchProps = ajvQuery.compile<AISearch>(AISearchSchema);

export type SearchAnswer = {
	query: string;
	messages: {
		_id: string;
		score?: number;
	}[];
};

const SearchAnswerSchema = {
	type: 'object',
	properties: {
		query: { type: 'string', minLength: 1, pattern: '\\S', maxLength: 500 },
		messages: {
			type: 'array',
			minItems: 1,
			maxItems: 20,
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string', minLength: 1, maxLength: 128 },
					score: { type: 'number', minimum: 0, maximum: 1 },
				},
				required: ['_id'],
				additionalProperties: false,
			},
		},
	},
	required: ['query', 'messages'],
	additionalProperties: false,
};

export const isSearchAnswerProps = ajv.compile<SearchAnswer>(SearchAnswerSchema);

export type AISearchResult = {
	_id: string;
	rid?: string;
	msgId?: string;
	text: string;
	score?: number;
	ts?: string;
	u?: { username: string; name?: string };
	room?: Pick<IRoom, '_id' | 't' | 'name' | 'fname'>;
};

export type AISearchEndpoints = {
	'/v1/ai.search': {
		GET: (params: AISearch) => {
			intelligent: AISearchResult[];
			meta: {
				intelligentSearchEnabled: boolean;
				intelligentSearchConfigured: boolean;
				answerGenerationConfigured: boolean;
			};
		};
	};
	'/v1/ai.search.answer': {
		POST: (params: SearchAnswer) => {
			answer: string;
			provider: { name: string; model: string };
		};
	};
	'/v1/ai.llm.models': {
		GET: () => { data: { key: string; label: string }[] };
	};
};
