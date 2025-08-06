import { ajv } from '../Ajv';

export type ChannelsModeratorsProps =
	| { roomId: string; userId?: string; username?: string; user?: string }
	| { roomName: string; userId?: string; username?: string; user?: string };

const channelsModeratorsPropsSchema = {
	type: 'object',
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: { type: 'string' },
				userId: {
					type: 'string',
					nullable: true,
				},
				username: {
					type: 'string',
					nullable: true,
				},
				user: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['roomId'],

			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: { type: 'string' },
				userId: {
					type: 'string',
					nullable: true,
				},
				username: {
					type: 'string',
					nullable: true,
				},
				user: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['roomName'],

			additionalProperties: false,
		},
	],
};

export const isChannelsModeratorsProps = ajv.compile<ChannelsModeratorsProps>(channelsModeratorsPropsSchema);
