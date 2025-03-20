import type { IRoom, IUser, ITeam } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

const ajv = new Ajv({
	coerceTypes: true,
});

type DirectoryProps = PaginatedRequest<{ text?: string; type?: string; workspace?: string; query?: string }>;

const DirectorySchema = {
	type: 'object',
	properties: {
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
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isDirectoryProps = ajv.compile<DirectoryProps>(DirectorySchema);

export type DirectoryEndpoint = {
	'/v1/directory': {
		GET: (params: DirectoryProps) => PaginatedResult<{ result: (IUser | IRoom | ITeam)[] }>;
	};
};
