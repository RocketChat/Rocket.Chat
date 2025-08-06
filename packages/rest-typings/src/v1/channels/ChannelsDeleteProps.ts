import Ajv from 'ajv';

const ajv = new Ajv({ allowUnionTypes: true });

export type ChannelsDeleteProps = { roomId: string } | { roomName: string };

const channelsDeletePropsSchema = {
	type: 'object',
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
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
			},
			required: ['roomName'],
			additionalProperties: false,
		},
	],
};

export const isChannelsDeleteProps = ajv.compile<ChannelsDeleteProps>(channelsDeletePropsSchema);
