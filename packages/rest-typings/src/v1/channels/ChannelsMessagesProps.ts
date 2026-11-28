import type { IRoom } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest.js';
import { ajvQuery } from '../Ajv.js';
import { paginationQueryProperties } from '../pagination.js';

export type ChannelsMessagesProps = PaginatedRequest<
	{
		roomId: IRoom['_id'];
		mentionIds?: string;
		starredIds?: string;
		pinned?: string;
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
