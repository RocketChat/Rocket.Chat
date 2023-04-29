import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from '../../helpers/schemas';

export type ChannelsGetAllUserMentionsByChannelProps = PaginatedRequest<{ roomId: string }>;

const channelsGetAllUserMentionsByChannelPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
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

export const isChannelsGetAllUserMentionsByChannelProps = ajv.compile<ChannelsGetAllUserMentionsByChannelProps>(
	channelsGetAllUserMentionsByChannelPropsSchema,
);
