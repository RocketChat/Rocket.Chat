import type { PaginatedRequest } from '../../helpers/PaginatedRequest.js';
import { ajvQuery } from '../Ajv.js';
import { paginationQueryProperties } from '../pagination.js';

export type DmMemberProps = PaginatedRequest<
	(
		| {
				roomId: string;
		  }
		| {
				username: string;
		  }
	) & {
		status?: string[];
		filter?: string;
	}
>;

export const isDmMemberProps = ajvQuery.compile<DmMemberProps>({
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				status: {
					type: 'array',
					items: {
						type: 'string',
					},
				},
				filter: {
					type: 'string',
				},
				sort: {
					type: 'string',
				},
				...paginationQueryProperties,
			},
			required: ['roomId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				username: {
					type: 'string',
				},
				status: {
					type: 'array',
					items: {
						type: 'string',
					},
				},
				filter: {
					type: 'string',
				},
				sort: {
					type: 'string',
				},
				...paginationQueryProperties,
			},
			required: ['username'],
			additionalProperties: false,
		},
	],
});
