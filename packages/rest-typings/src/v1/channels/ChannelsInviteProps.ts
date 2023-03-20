import Ajv from 'ajv';

const ajv = new Ajv();

export type ChannelsInviteProps = { roomId: string } | { roomName: string };

const channelsInvitePropsSchema = {
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

export const isChannelsInviteProps = ajv.compile<ChannelsInviteProps>(channelsInvitePropsSchema);
