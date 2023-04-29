import type { IRoom, IUser, ITeam } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';
import { ajv } from '../helpers/schemas';

type DirectoryProps = PaginatedRequest;

const DirectorySchema = {
	type: 'object',
	properties: {
		query: {
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
	},
	additionalProperties: false,
};

export const isDirectoryProps = ajv.compile<DirectoryProps>(DirectorySchema);

export type DirectoryEndpoint = {
	'/v1/directory': {
		GET: (params: DirectoryProps) => PaginatedResult<{ result: (IUser | IRoom | ITeam)[] }>;
	};
};
