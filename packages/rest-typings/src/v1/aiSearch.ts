import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

import { ajv, ajvQuery } from './Ajv';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';

type UnifiedSearch = PaginatedRequest<{
	query: string;
	includeMessages?: boolean;
	includeIntelligent?: boolean;
	includeSpotlight?: boolean;
	intelligentCount?: number;
	rid?: string;
	rids?: string;
	roomNames?: string;
	fromUsername?: string;
	fromUsernames?: string;
	startDate?: string;
	endDate?: string;
}>;

const UnifiedSearchSchema = {
	type: 'object',
	properties: {
		query: { type: 'string', minLength: 1, pattern: '\\S', maxLength: 500 },
		includeMessages: { type: 'boolean' },
		includeIntelligent: { type: 'boolean' },
		includeSpotlight: { type: 'boolean' },
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
		count: { type: 'number' },
		offset: { type: 'number' },
		sort: { type: 'string' },
	},
	required: ['query'],
	additionalProperties: false,
};

export const isUnifiedSearchProps = ajvQuery.compile<UnifiedSearch>(UnifiedSearchSchema);

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

export type UnifiedSearchMessageResult = Pick<IMessage, '_id' | 'rid' | 'msg' | 'ts' | 'u'> & {
	room?: Pick<IRoom, '_id' | 't' | 'name' | 'fname'>;
};

export type UnifiedSearchIntelligentResult = {
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
	'/v1/search.unified': {
		GET: (params: UnifiedSearch) => {
			users: (Pick<Required<IUser>, 'name' | 'status' | '_id' | 'username'> & Partial<Pick<IUser, 'statusText' | 'avatarETag'>>)[];
			rooms: Pick<IRoom, 't' | 'name' | 'fname' | '_id'>[];
			messages: UnifiedSearchMessageResult[];
			intelligent: UnifiedSearchIntelligentResult[];
			meta: {
				globalMessagesEnabled: boolean;
				intelligentSearchEnabled: boolean;
				intelligentSearchConfigured: boolean;
				answerGenerationConfigured: boolean;
			};
		};
	};
	'/v1/search.answer': {
		POST: (params: SearchAnswer) => {
			answer: string;
			provider: { name: string; model: string };
		};
	};
	'/v1/ai.llm.models': {
		GET: () => { data: { key: string; label: string }[] };
	};
};
