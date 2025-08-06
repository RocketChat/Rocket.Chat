import { ajv } from '../Ajv';

export type ChannelsAddAllProps = ({ roomId: string } | { roomName: string }) & {
	activeUsersOnly?: 'true' | 'false' | 1 | 0;
};
const channelsAddAllPropsSchema = {
	type: 'object',
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				activeUsersOnly: {
					type: 'boolean',
					nullable: true,
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
				activeUsersOnly: {
					type: 'boolean',
					nullable: true,
				},
			},
			required: ['roomName'],
			additionalProperties: false,
		},
	],
};

export const isChannelsAddAllProps = ajv.compile<ChannelsAddAllProps>(channelsAddAllPropsSchema);
