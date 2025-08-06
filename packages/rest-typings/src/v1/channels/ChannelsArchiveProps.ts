import Ajv from 'ajv';

const ajv = new Ajv({ allowUnionTypes: true });

export type ChannelsArchiveProps = { roomId: string } | { roomName: string };
const channelsArchivePropsSchema = {
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

export const isChannelsArchiveProps = ajv.compile<ChannelsArchiveProps>(channelsArchivePropsSchema);
