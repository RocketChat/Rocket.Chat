import { ajv } from '../Ajv';

type ChannelsInviteUsers = { userId?: string; userIds?: string[] } | { username?: string; user?: string; usernames?: string[] };

export type ChannelsInviteProps = ({ roomId: string } | { roomName: string }) & ChannelsInviteUsers;

const userProperties = {
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
	userIds: {
		type: 'array',
		items: { type: 'string' },
	},
	usernames: {
		type: 'array',
		items: { type: 'string' },
	},
};

const channelsInvitePropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				...userProperties,
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
				...userProperties,
			},
			required: ['roomName'],
			additionalProperties: false,
		},
	],
	not: {
		allOf: [
			{ anyOf: [{ required: ['userId'] }, { required: ['userIds'] }] },
			{ anyOf: [{ required: ['username'] }, { required: ['user'] }, { required: ['usernames'] }] },
		],
	},
};

export const isChannelsInviteProps = ajv.compile<ChannelsInviteProps>(channelsInvitePropsSchema);
