import Ajv from 'ajv';

const ajv = new Ajv();

export type ChannelsCloseProps = { roomId: string } | { roomName: string };

const ChannelsClosePropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: { type: 'string' },
			},
			required: ['roomId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: { type: 'string' },
			},
			required: ['roomName'],
			additionalProperties: false,
		},
	],
};

export const isChannelsCloseProps = ajv.compile<ChannelsCloseProps>(ChannelsClosePropsSchema);
