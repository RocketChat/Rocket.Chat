import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({ coerceTypes: true });

export type ChannelsGetAllUserMentionsByChannelProps = PaginatedRequest<{ roomId: string }>;

const channelsGetAllUserMentionsByChannelPropsSchema = {
	type: 'object',
	properties: {
		roomId: { type: 'string' },
		offset: { type: 'number' },
		count: { type: 'number' },
		sort: { type: 'string' },
		query: { type: 'string' },
	},
	required: ['roomId'],

	additionalProperties: false,
};

export const isChannelsGetAllUserMentionsByChannelProps = ajv.compile<ChannelsGetAllUserMentionsByChannelProps>(
	channelsGetAllUserMentionsByChannelPropsSchema,
);
