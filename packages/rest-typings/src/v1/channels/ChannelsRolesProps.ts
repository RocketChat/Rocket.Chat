import { ajv } from '../Ajv';

export type ChannelsRolesProps = { roomId: string } | { roomName: string };
const channelsRolesPropsSchema = {
	type: 'object',
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

export const isChannelsRolesProps = ajv.compile<ChannelsRolesProps>(channelsRolesPropsSchema);
