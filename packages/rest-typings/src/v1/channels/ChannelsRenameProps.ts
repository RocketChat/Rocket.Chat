import { ajv } from '../../helpers/schemas';

export type ChannelsRenameProps = { roomId: string; name: string } | { roomName: string; name: string };

const channelsRenamePropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				name: {
					type: 'string',
				},
			},
			required: ['roomId', 'name'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: {
					type: 'string',
				},
				name: {
					type: 'string',
				},
			},
			required: ['roomName', 'name'],
			additionalProperties: false,
		},
	],
};

export const isChannelsRenameProps = ajv.compile<ChannelsRenameProps>(channelsRenamePropsSchema);
