import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';

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
				...paginationQueryProperties,
			},
			required: ['username'],
			additionalProperties: false,
		},
	],
});
