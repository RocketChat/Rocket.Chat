import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';

export type DmMessagesProps = PaginatedRequest<
	({ roomId: string } | { username: string }) & {
		mentionIds?: string;
		starredIds?: string;
		pinned?: string;
	}
>;

export const isDmMessagesProps = ajvQuery.compile<DmMessagesProps>({
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				mentionIds: {
					type: 'string',
				},
				starredIds: {
					type: 'string',
				},
				pinned: {
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
				mentionIds: {
					type: 'string',
				},
				starredIds: {
					type: 'string',
				},
				pinned: {
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
