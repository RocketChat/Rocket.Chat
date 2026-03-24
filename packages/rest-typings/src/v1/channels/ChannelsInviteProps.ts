import { ajv } from '../Ajv';

export type ChannelsInviteProps =
	| { roomId: string; userId?: string; username?: string; user?: string; unbanBeforeAdd?: boolean }
	| { roomName: string; userId?: string; username?: string; user?: string; unbanBeforeAdd?: boolean };

const channelsInvitePropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
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
				unbanBeforeAdd: {
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
				unbanBeforeAdd: {
					type: 'boolean',
					nullable: true,
				},
			},
			required: ['roomName'],
			additionalProperties: false,
		},
	],
};

export const isChannelsInviteProps = ajv.compile<ChannelsInviteProps>(channelsInvitePropsSchema);
