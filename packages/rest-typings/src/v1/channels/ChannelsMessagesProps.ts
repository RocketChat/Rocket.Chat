import type { IRoom } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({ coerceTypes: true });

export type ChannelsMessagesProps = PaginatedRequest<
	{
		roomId: IRoom['_id'];
		mentionIds?: string;
		starredIds?: string;
		pinned?: boolean;
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
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
	},

	required: ['roomId'],
	additionalProperties: false,
};

export const isChannelsMessagesProps = ajv.compile<ChannelsMessagesProps>(channelsMessagesPropsSchema);
