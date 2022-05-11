import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv();

export type ChannelsGetAllUserMentionsByChannelProps = PaginatedRequest<{ roomId: string } | { roomName: string }>;

const channelsGetAllUserMentionsByChannelPropsSchema = {
	oneOf: [
		{
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
		},
		{
			type: 'object',
			properties: {
				roomName: { type: 'string' },
				offset: { type: 'number' },
				count: { type: 'number' },
				sort: { type: 'string' },
				query: { type: 'string' },
			},
			required: ['roomName'],

			additionalProperties: false,
		},
	],
};

export const isChannelsGetAllUserMentionsByChannelProps = ajv.compile<ChannelsGetAllUserMentionsByChannelProps>(
	channelsGetAllUserMentionsByChannelPropsSchema,
);
