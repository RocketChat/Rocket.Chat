import { ajv } from '../../helpers/schemas';

export type ChannelsKickProps = { roomId: string; userId: string } | { roomName: string; userId: string };

const channelsKickPropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				userId: {
					type: 'string',
				},
			},
			required: ['roomId', 'userId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: {
					type: 'string',
				},
				userId: {
					type: 'string',
				},
			},
			required: ['roomName', 'userId'],
			additionalProperties: false,
		},
	],
};

export const isChannelsKickProps = ajv.compile<ChannelsKickProps>(channelsKickPropsSchema);
