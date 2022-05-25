import type { IRoom } from '@rocket.chat/core-typings';
import Ajv, { JSONSchemaType } from 'ajv';

import type { PaginatedResult } from '../helpers/PaginatedResult';

const ajv = new Ajv();

type DirectoryProps = {
	query: { [key: string]: string };
	count: number;
	offset: number;
	sort: { [key: string]: number };
};

const DirectorySchema: JSONSchemaType<DirectoryProps> = {
	type: 'object',
	properties: {
		query: {
			type: 'object',
		},
		count: {
			type: 'number',
		},
		offset: {
			type: 'number',
		},
		sort: {
			type: 'object',
		},
	},
	required: ['query', 'count', 'offset', 'sort'],
	additionalProperties: false,
};

export const isDirectoryProps = ajv.compile(DirectorySchema);

export type DirectoryEndpoint = {
	directory: {
		GET: (params: DirectoryProps) => PaginatedResult<{ result: IRoom[] }>;
	};
};
