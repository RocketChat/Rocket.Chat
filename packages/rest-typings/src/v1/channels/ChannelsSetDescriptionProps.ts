import { ajv } from '../../helpers/schemas';

export type ChannelsSetDescriptionProps = { roomId: string; description: string } | { roomName: string; description: string };

const channelsSetDescriptionPropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				description: {
					type: 'string',
				},
			},
			required: ['roomId', 'description'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: {
					type: 'string',
				},
				description: {
					type: 'string',
				},
			},
			required: ['roomName', 'description'],
			additionalProperties: false,
		},
	],
};

export const isChannelsSetDescriptionProps = ajv.compile<ChannelsSetDescriptionProps>(channelsSetDescriptionPropsSchema);
