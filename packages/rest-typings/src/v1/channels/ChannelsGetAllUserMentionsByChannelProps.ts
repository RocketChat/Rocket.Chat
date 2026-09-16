import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';

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
		query: {
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
