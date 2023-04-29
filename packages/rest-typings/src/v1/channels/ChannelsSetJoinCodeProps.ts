import { ajv } from '../../helpers/schemas';

export type ChannelsSetJoinCodeProps = { roomId: string; joinCode: string } | { roomName: string; joinCode: string };

const channelsSetJoinCodePropsSchema = {
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

export const isChannelsSetJoinCodeProps = ajv.compile<ChannelsSetJoinCodeProps>(channelsSetJoinCodePropsSchema);
