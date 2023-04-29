import type { IRoom } from '@rocket.chat/core-typings';

import { ajv } from '../../helpers/schemas';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

// query: { 'mentions._id': { $in: string[] } } | { 'starred._id': { $in: string[] } } | { pinned: boolean };
export type ChannelsMessagesProps = PaginatedRequest<{ roomId: IRoom['_id'] }, 'ts'>;

const channelsMessagesPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		query: {
			type: 'string',
			nullable: true,
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
