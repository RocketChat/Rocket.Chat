import Ajv from 'ajv';

const ajv = new Ajv();

export type ChannelsSetReadOnlyProps = { roomId: string; readOnly: boolean };

const channelsSetReadOnlyPropsSchema = {
	type: 'object',
	properties: {
		roomId: { type: 'string' },
		readOnly: { type: 'boolean' },
	},
	required: ['roomId', 'readOnly'],
};

export const isChannelsSetReadOnlyProps = ajv.compile<ChannelsSetReadOnlyProps>(channelsSetReadOnlyPropsSchema);
