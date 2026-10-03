import type { IRoom } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';

export type ChannelsMessagesProps = PaginatedRequest<
	{
		roomId: IRoom['_id'];
		mentionIds?: string;
		starredIds?: string;
		pinned?: string;
		query?: Record<string, any>;
	},
	'ts'
>;

const channelsMessagesPropsSchema = {
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
		query: {
			type: 'string',
		},
		...paginationQueryProperties,
		sort: {
			type: 'string',
			nullable: true,
		},
	},

	required: ['roomId'],
	additionalProperties: false,
};

export const isChannelsMessagesProps = ajvQuery.compile<ChannelsMessagesProps>(channelsMessagesPropsSchema);
