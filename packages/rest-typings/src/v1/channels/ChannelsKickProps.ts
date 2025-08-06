import Ajv from 'ajv';

const ajv = new Ajv({ allowUnionTypes: true });

export type ChannelsKickProps = { roomId: string; userId: string } | { roomName: string; userId: string };

const channelsKickPropsSchema = {
	type: 'object',
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
