import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({ coerceTypes: true });

export type ChannelsGetAllUserMentionsByChannelProps = PaginatedRequest<{ roomId: string } | { roomName: string }>;

const channelsGetAllUserMentionsByChannelPropsSchema = {
	oneOf: [
		{
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
		},
		{
			type: 'object',
			properties: {
				roomName: {
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
			required: ['roomName'],

			additionalProperties: false,
		},
	],
};

export const isChannelsGetAllUserMentionsByChannelProps = ajv.compile<ChannelsGetAllUserMentionsByChannelProps>(
	channelsGetAllUserMentionsByChannelPropsSchema,
);
