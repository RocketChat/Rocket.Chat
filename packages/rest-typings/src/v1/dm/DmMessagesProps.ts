import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv();

export type DmMessagesProps = PaginatedRequest<
	(
		| {
				roomId: string;
		  }
		| {
				username: string;
		  }
	) & {
		fields?: string;
	}
>;

export const isDmMessagesProps = ajv.compile<DmMessagesProps>({
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				fields: {
					type: 'string',
				},
				query: {
					type: 'string',
				},
				sort: {
					type: 'string',
				},
				count: {
					type: 'string',
				},
				offset: {
					type: 'string',
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
				fields: {
					type: 'string',
				},
				sort: {
					type: 'string',
				},
				count: {
					type: 'string',
				},
				offset: {
					type: 'string',
				},
			},
			required: ['username'],
			additionalProperties: false,
		},
	],
});
