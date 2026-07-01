import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

import { ajv, ajvQuery } from './Ajv';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';

type ShieldSvg = {
	type?: string;
	icon?: 'true' | 'false';
	channel: string;
	name: string;
	userId?: string;
	username?: string;
	user?: string;
};

const ShieldSvgSchema = {
	type: 'object',
	properties: {
		type: {
			type: 'string',
			nullable: true,
		},
		icon: {
			type: 'string',
			enum: ['true', 'false'],
			nullable: true,
		},
		channel: {
			type: 'string',
		},
		name: {
			type: 'string',
		},
	},
	required: ['name', 'channel'],
	additionalProperties: false,
};

export const isShieldSvgProps = ajv.compile<ShieldSvg>(ShieldSvgSchema);

type SpotlightType = {
	users?: boolean;
	mentions?: boolean;
	rooms?: boolean;
	includeFederatedRooms?: boolean;
};

type Spotlight = {
	query: string;
	usernames?: string;
	type?: string;
	rid?: string;
};

const SpotlightSchema = {
	type: 'object',
	properties: {
		query: {
			type: 'string',
		},
		usernames: {
			type: 'string',
			nullable: true,
		},
		type: {
			type: 'string',
			nullable: true,
		},
		rid: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['query'],
	additionalProperties: false,
};

export const isSpotlightProps = ajvQuery.compile<Spotlight>(SpotlightSchema);

const parseSpotlightUsernames = (usernames?: string): string[] | undefined =>
	usernames ? usernames.split(',').filter(Boolean) : undefined;

const parseSpotlightType = (raw?: string): SpotlightType | undefined => {
	if (!raw) {
		return undefined;
	}

	try {
		const parsed = JSON.parse(raw) as SpotlightType;
		return parsed && typeof parsed === 'object' ? parsed : undefined;
	} catch {
		return undefined;
	}
};

export { parseSpotlightUsernames, parseSpotlightType };
export type { SpotlightType };

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
		query: {
			type: 'string',
			minLength: 1,
			pattern: '\\S',
			maxLength: 500,
		},
		includeMessages: {
			type: 'boolean',
		},
		includeIntelligent: {
			type: 'boolean',
		},
		includeSpotlight: {
			type: 'boolean',
		},
		intelligentCount: {
			type: 'number',
		},
		rid: {
			type: 'string',
			minLength: 1,
			maxLength: 256,
		},
		rids: {
			type: 'string',
			minLength: 1,
			maxLength: 4096,
		},
		roomNames: {
			type: 'string',
			minLength: 1,
			maxLength: 4096,
		},
		fromUsername: {
			type: 'string',
			minLength: 1,
			maxLength: 256,
		},
		fromUsernames: {
			type: 'string',
			minLength: 1,
			maxLength: 4096,
		},
		startDate: {
			anyOf: [
				{ type: 'string', format: 'date' },
				{ type: 'string', format: 'date-time' },
			],
		},
		endDate: {
			anyOf: [
				{ type: 'string', format: 'date' },
				{ type: 'string', format: 'date-time' },
			],
		},
		count: {
			type: 'number',
		},
		offset: {
			type: 'number',
		},
		sort: {
			type: 'string',
		},
	},
	required: ['query'],
	additionalProperties: false,
};

export const isUnifiedSearchProps = ajvQuery.compile<UnifiedSearch>(UnifiedSearchSchema);

export type SearchAnswer = {
	query: string;
	messages: {
		_id: string;
		text?: string;
		username?: string;
		roomName?: string;
		ts?: string;
		score?: number;
	}[];
};

const SearchAnswerSchema = {
	type: 'object',
	properties: {
		query: {
			type: 'string',
			minLength: 1,
			pattern: '\\S',
			maxLength: 500,
		},
		messages: {
			type: 'array',
			minItems: 1,
			maxItems: 20,
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					text: { type: 'string', maxLength: 4000 },
					username: { type: 'string' },
					roomName: { type: 'string' },
					ts: { type: 'string' },
					score: { type: 'number' },
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

type Directory = PaginatedRequest<{
	text: string;
	type: string;
	workspace: string;
}>;

const DirectorySchema = {
	type: 'object',
	properties: {
		text: {
			type: 'string',
			nullable: true,
		},
		type: {
			type: 'string',
			nullable: true,
		},
		workspace: {
			type: 'string',
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isDirectoryProps = ajvQuery.compile<Directory>(DirectorySchema);

type MethodCall = { method: string; params: unknown[]; id: string; msg: 'string' };

const MethodCallSchema = {
	type: 'object',
	properties: {
		method: {
			type: 'string',
		},
		params: {
			type: 'array',
		},
		id: {
			type: 'string',
		},
		msg: {
			type: 'string',
			enum: ['method'],
		},
	},
	required: ['method', 'params', 'id', 'msg'],
	additionalProperties: false,
};

export const isMethodCallProps = ajv.compile<MethodCall>(MethodCallSchema);

export const isMeteorCall = ajv.compile<{
	message: string;
}>({
	type: 'object',
	properties: {
		message: {
			type: 'string',
		},
	},
	required: ['message'],
	additionalProperties: false,
});

type MethodCallAnon = { method: string; params: unknown[]; id: string; msg: 'method' };

const MethodCallAnonSchema = {
	type: 'object',
	properties: {
		method: {
			type: 'string',
		},
		params: {
			type: 'array',
		},
		id: {
			type: 'string',
		},
		msg: {
			type: 'string',
			enum: ['method'],
		},
	},
	required: ['method', 'params', 'id', 'msg'],
	additionalProperties: false,
};

export const isMethodCallAnonProps = ajv.compile<MethodCallAnon>(MethodCallAnonSchema);

type Fingerprint = { setDeploymentAs: 'new-workspace' | 'updated-configuration' };

const FingerprintSchema = {
	type: 'object',
	properties: {
		setDeploymentAs: {
			type: 'string',
			enum: ['new-workspace', 'updated-configuration'],
		},
	},
	required: ['setDeploymentAs'],
	additionalProperties: false,
};

export const isFingerprintProps = ajv.compile<Fingerprint>(FingerprintSchema);

export type MiscEndpoints = {
	'/v1/shield.svg': {
		GET: (params: ShieldSvg) => {
			svg: string;
		};
	};

	'/v1/spotlight': {
		GET: (params: Spotlight) => {
			users: (Pick<Required<IUser>, 'name' | '_id' | 'username'> &
				Partial<Pick<IUser, 'status' | 'statusText' | 'avatarETag'>> & { nickname?: string; outside?: boolean })[];
			rooms: (Pick<Required<IRoom>, 't' | 'name' | 'lastMessage' | '_id'> & { uids?: string[]; usernames?: string[]; fname?: string })[];
		};
	};

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
			provider: {
				name: string;
				model: string;
			};
		};
	};

	'/v1/ai.llm.models': {
		GET: () => { data: { key: string; label: string }[] };
	};

	'/v1/pw.getPolicy': {
		GET: () => {
			enabled: boolean;
			policy: [name: string, value?: Record<string, number | boolean>][];
		};
	};

	'/v1/method.call/:method': {
		POST: (params: { message: string }) => {
			message: string;
		};
	};

	'/v1/method.callAnon/:method': {
		POST: (params: { message: string }) => {
			message: string;
		};
	};

	'/v1/fingerprint': {
		POST: (params: Fingerprint) => {
			success: boolean;
		};
	};

	'/v1/smtp.check': {
		GET: () => {
			isSMTPConfigured: boolean;
		};
	};
};
