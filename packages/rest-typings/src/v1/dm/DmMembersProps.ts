import { ajv } from '../../helpers/schemas';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

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

export const isDmMemberProps = ajv.compile<DmMemberProps>({
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
				count: {
					type: 'number',
				},
				offset: {
					type: 'number',
				},
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
				count: {
					type: 'number',
				},
				offset: {
					type: 'number',
				},
			},
			required: ['username'],
			additionalProperties: false,
		},
	],
});
