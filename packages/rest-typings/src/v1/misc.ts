import type { IRoom, ITeam, IUser } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

const ajv = new Ajv();

type ShieldSvg = {
	type: string;
	icon: string;
	channel: string;
	name: string;
	text: string;
	color: string;
	size: number;
};

const ShieldSvgSchema = {
	type: 'object',
	properties: {
		type: {
			type: 'string',
		},
		icon: {
			type: 'string',
		},
		channel: {
			type: 'string',
		},
		name: {
			type: 'string',
		},
		text: {
			type: 'string',
		},
		color: {
			type: 'string',
		},
		size: {
			type: 'number',
		},
	},
	required: ['type', 'icon', 'channel', 'name', 'text', 'color', 'size'],
	additionalProperties: false,
};

export const isShieldSvgProps = ajv.compile(ShieldSvgSchema);

type Spotlight = { query: string; limit: number; offset: number };

const SpotlightSchema = {
	type: 'object',
	properties: {
		query: {
			type: 'string',
		},
		limit: {
			type: 'number',
		},
		offset: {
			type: 'number',
		},
	},
	required: ['query', 'limit', 'offset'],
	additionalProperties: false,
};

export const isSpotlightProps = ajv.compile(SpotlightSchema);

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
	required: ['text', 'type', 'workspace'],
	additionalProperties: false,
};

export const isDirectoryProps = ajv.compile(DirectorySchema);

type MethodCall = { method: string; params: {}; id: string }; // params: unknown

const MethodCallSchema = {
	type: 'object',
	properties: {
		method: {
			type: 'string',
		},
		params: {
			type: 'object',
		},
		id: {
			type: 'string',
		},
	},
	required: ['method', 'params', 'id'],
	additionalProperties: false,
};

export const isMethodCallProps = ajv.compile(MethodCallSchema);

type MethodCallAnon = { method: string; params: {}; id: string }; // params: unknown

const MethodCallAnonSchema = {
	type: 'object',
	properties: {
		method: {
			type: 'string',
		},
		params: {
			type: 'object',
		},
		id: {
			type: 'string',
		},
	},
	required: ['method', 'params', 'id'],
	additionalProperties: false,
};

export const isMethodCallAnonProps = ajv.compile(MethodCallAnonSchema);

export type MiscEndpoints = {
	'stdout.queue': {
		GET: () => {
			queue: {
				id: string;
				string: string;
				ts: Date;
			}[];
		};
	};

	// type DefaultUserFields = {
	// 	[k: string]: number;
	// };

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
