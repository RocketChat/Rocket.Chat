import type { IRoom, ITeam, IUser } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

const ajv = new Ajv({
	coerceTypes: true,
});

type ShieldSvg = {
	type?: string;
	icon?: 'true' | 'false';
	channel: string;
	name: string;
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

type Spotlight = { query: string; limit: number; offset: number };

const SpotlightSchema = {
	type: 'object',
	properties: {
		query: {
			type: 'string',
		},
		limit: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
	},
	required: ['query'],
	additionalProperties: false,
};

export const isSpotlightProps = ajv.compile<Spotlight>(SpotlightSchema);

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

export const isDirectoryProps = ajv.compile<Directory>(DirectorySchema);

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

export type MiscEndpoints = {
	'/v1/stdout.queue': {
		GET: () => {
			queue: {
				id: string;
				string: string;
				ts: Date;
			}[];
		};
	};
	'me': {
		GET: (params: { fields: { [k: string]: number }; user: IUser }) => IUser & {
			email?: string;
			settings: {
				profile: {};
				preferences: unknown;
			};
			avatarUrl: string;
		};
	};

	'shield.svg': {
		GET: (params: ShieldSvg) => {
			svg: string;
		};
	};

	'spotlight': {
		GET: (params: Spotlight) => {
			users: Pick<IUser, 'username' | 'name' | 'status' | 'statusText' | 'avatarETag'>[];
			rooms: IRoom[];
		};
	};

	'directory': {
		GET: (params: Directory) => PaginatedResult<{
			result: (IUser | IRoom | ITeam)[];
		}>;
	};

	'method.call': {
		POST: (params: MethodCall) => {
			result: unknown;
		};
	};

	'method.callAnon': {
		POST: (params: MethodCallAnon) => {
			result: unknown;
		};
	};
};
