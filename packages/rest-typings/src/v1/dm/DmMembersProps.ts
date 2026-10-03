import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';

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
				query: {
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
				query: {
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
