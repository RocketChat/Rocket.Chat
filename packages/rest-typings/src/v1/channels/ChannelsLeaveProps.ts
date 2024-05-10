import Ajv from 'ajv';

const ajv = new Ajv();

export type ChannelsLeaveProps = { roomId: string } | { roomName: string };

const channelsLeavePropsSchema = {
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

export const isChannelsLeaveProps = ajv.compile<ChannelsLeaveProps>(channelsLeavePropsSchema);
