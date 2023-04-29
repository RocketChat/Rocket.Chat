import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from '../../helpers/schemas';

export type DmFileProps = PaginatedRequest<
	(
		| {
				roomId: string;
		  }
		| {
				username: string;
		  }
	) & { fields?: string }
>;

export const isDmFileProps = ajv.compile<DmFileProps>({
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
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
