import Ajv from 'ajv';

const ajv = new Ajv();

export type ChannelsKickProps = { roomId: string; userId: string };

const channelsKickPropsSchema = {
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
};

export const isChannelsKickProps = ajv.compile<ChannelsKickProps>(channelsKickPropsSchema);
