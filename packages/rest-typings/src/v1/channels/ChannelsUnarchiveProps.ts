import Ajv from 'ajv';

const ajv = new Ajv();

export type ChannelsUnarchiveProps = { roomId: string } | { roomName: string };
const channelsUnarchivePropsSchema = {
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

export const isChannelsUnarchiveProps = ajv.compile<ChannelsUnarchiveProps>(channelsUnarchivePropsSchema);
