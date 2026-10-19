import type { IDirectoryChannelResult, IDirectoryUserResult } from '@rocket.chat/core-typings';

import { ajv } from './Ajv';
import { paginationQueryProperties } from './pagination';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

type DirectoryProps = PaginatedRequest<{ text?: string; type?: string; workspace?: string; query?: string }>;

const DirectorySchema = {
	type: 'object',
	properties: {
		...paginationQueryProperties,
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
		GET: (params: DirectoryProps) => PaginatedResult<{ result: (IDirectoryUserResult | IDirectoryChannelResult)[] }>;
	};
};
