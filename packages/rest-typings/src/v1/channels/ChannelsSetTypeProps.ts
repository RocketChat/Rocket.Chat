import { ajv } from './../Ajv';
export type ChannelsSetTypeProps = { roomId: string; type: string } | { roomName: string; type: string };

const channelsSetTypePropsSchema = {
	type: 'object',
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				type: {
					type: 'string',
				},
			},
			required: ['roomId', 'type'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: {
					type: 'string',
				},
				type: {
					type: 'string',
				},
			},
			required: ['roomName', 'type'],
			additionalProperties: false,
		},
	],
};

export const isChannelsSetTypeProps = ajv.compile<ChannelsSetTypeProps>(channelsSetTypePropsSchema);
