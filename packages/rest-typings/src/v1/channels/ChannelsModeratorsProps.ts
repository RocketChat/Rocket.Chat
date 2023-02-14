import Ajv from 'ajv';

const ajv = new Ajv();

export type ChannelsModeratorsProps = { roomId: string } | { roomName: string };

const channelsModeratorsPropsSchema = {
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

export const isChannelsModeratorsProps = ajv.compile<ChannelsModeratorsProps>(channelsModeratorsPropsSchema);
