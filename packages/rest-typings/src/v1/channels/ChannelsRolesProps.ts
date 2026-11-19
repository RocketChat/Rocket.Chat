import { ajvQuery } from '../Ajv.js';

export type ChannelsRolesProps = { roomId: string } | { roomName: string };
const channelsRolesPropsSchema = {
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

export const isChannelsRolesProps = ajvQuery.compile<ChannelsRolesProps>(channelsRolesPropsSchema);
