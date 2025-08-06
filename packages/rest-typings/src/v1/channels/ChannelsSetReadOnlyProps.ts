import { ajv } from './../Ajv';
export type ChannelsSetReadOnlyProps = { roomId: string; readOnly: boolean } | { roomName: string; readOnly: boolean };

const channelsSetReadOnlyPropsSchema = {
	type: 'object',
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: { type: 'string' },
				readOnly: { type: 'boolean' },
			},
			required: ['roomId', 'readOnly'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: { type: 'string' },
				readOnly: { type: 'boolean' },
			},
			required: ['roomName', 'readOnly'],
			additionalProperties: false,
		},
	],
};

export const isChannelsSetReadOnlyProps = ajv.compile<ChannelsSetReadOnlyProps>(channelsSetReadOnlyPropsSchema);
