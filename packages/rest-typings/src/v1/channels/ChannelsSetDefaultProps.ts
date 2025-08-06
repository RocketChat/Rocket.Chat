import Ajv from 'ajv';

const ajv = new Ajv({ allowUnionTypes: true });

export type ChannelsSetDefaultProps = { roomId: string; default: boolean } | { roomName: string; default: boolean };

const channelsSetDefaultPropsSchema = {
	type: 'object',
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				default: {
					type: 'string',
				},
			},
			required: ['roomId', 'default'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: {
					type: 'string',
				},
				default: {
					type: 'default',
				},
			},
			required: ['roomName', 'default'],
			additionalProperties: false,
		},
	],
};

export const isChannelsSetDefaultProps = ajv.compile<ChannelsSetDefaultProps>(channelsSetDefaultPropsSchema);
