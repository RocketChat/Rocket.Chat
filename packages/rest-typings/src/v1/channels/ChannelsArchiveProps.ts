import { ajv } from '../../helpers/schemas';

export type ChannelsArchiveProps = { roomId: string } | { roomName: string };
const channelsArchivePropsSchema = {
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
