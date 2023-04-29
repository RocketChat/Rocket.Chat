import { ajv } from '../../helpers/schemas';

export type ChannelsDeleteProps = { roomId: string } | { roomName: string };

const channelsDeletePropsSchema = {
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
