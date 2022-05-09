import Ajv from 'ajv';

const ajv = new Ajv();

export type ChannelsModeratorsProps = { roomId: string };

const channelsModeratorsPropsSchema = {
	type: 'object',
	properties: {
		roomId: { type: 'string' },
	},
	required: ['roomId'],

	additionalProperties: false,
};

export const isChannelsModeratorsProps = ajv.compile<ChannelsModeratorsProps>(channelsModeratorsPropsSchema);
