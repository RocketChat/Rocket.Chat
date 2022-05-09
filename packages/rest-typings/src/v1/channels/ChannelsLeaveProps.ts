import Ajv from 'ajv';

const ajv = new Ajv();

export type ChannelsLeaveProps = { roomId: string };

const channelsLeavePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isChannelsLeaveProps = ajv.compile<ChannelsLeaveProps>(channelsLeavePropsSchema);
