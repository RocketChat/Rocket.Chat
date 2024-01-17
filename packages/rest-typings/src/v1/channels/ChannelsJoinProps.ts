import Ajv from 'ajv';

const ajv = new Ajv();

export type ChannelsJoinProps = { roomId: string; joinCode?: string } | { roomName: string; joinCode?: string };

const channelsJoinPropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				joinCode: {
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
				roomName: {
					type: 'string',
				},
				joinCode: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['roomName'],
			additionalProperties: false,
		},
	],
};

export const isChannelsJoinProps = ajv.compile<ChannelsJoinProps>(channelsJoinPropsSchema);
