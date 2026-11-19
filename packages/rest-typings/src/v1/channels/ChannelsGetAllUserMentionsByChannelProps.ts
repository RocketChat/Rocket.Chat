import type { PaginatedRequest } from '../../helpers/PaginatedRequest.js';
import { ajvQuery } from '../Ajv.js';
import { paginationQueryProperties } from '../pagination.js';

export type ChannelsGetAllUserMentionsByChannelProps = PaginatedRequest<{ roomId: string }>;

const channelsGetAllUserMentionsByChannelPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
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

export const isChannelsGetAllUserMentionsByChannelProps = ajvQuery.compile<ChannelsGetAllUserMentionsByChannelProps>(
	channelsGetAllUserMentionsByChannelPropsSchema,
);
