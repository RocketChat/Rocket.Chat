import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from '../../helpers/schemas';

export type ChannelsHistoryProps = PaginatedRequest<
	({ roomId: string } | { roomName: string }) & {
		latest?: string;
		showThreadMessages?: 'false' | 'true';
		oldest?: string;
		unreads?: 'true' | 'false';
		inclusive?: 'false' | 'true';
	}
>;
const channelsHistoryPropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
					minLength: 1,
				},
				latest: {
					type: 'string',
					minLength: 1,
					nullable: true,
				},
				showThreadMessages: {
					type: 'string',
					enum: ['false', 'true'],
					nullable: true,
				},
				oldest: {
					type: 'string',
					minLength: 1,
					nullable: true,
				},
				inclusive: {
					type: 'string',
					enum: ['false', 'true'],
					nullable: true,
				},
				unreads: {
					type: 'string',
					enum: ['true', 'false'],
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
		},
		{
			type: 'object',
			properties: {
				roomName: {
					type: 'string',
					minLength: 1,
				},
				latest: {
					type: 'string',
					minLength: 1,
					nullable: true,
				},
				showThreadMessages: {
					type: 'string',
					enum: ['false', 'true'],
					nullable: true,
				},
				oldest: {
					type: 'string',
					minLength: 1,
					nullable: true,
				},
				inclusive: {
					type: 'string',
					enum: ['false', 'true'],
					nullable: true,
				},
				unreads: {
					type: 'string',
					enum: ['true', 'false'],
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
			required: ['roomName'],
			additionalProperties: false,
		},
	],
};

export const isChannelsHistoryProps = ajv.compile<ChannelsHistoryProps>(channelsHistoryPropsSchema);
