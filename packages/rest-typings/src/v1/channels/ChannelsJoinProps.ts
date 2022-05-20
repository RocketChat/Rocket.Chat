import Ajv from 'ajv';

const ajv = new Ajv();

export type ChannelsJoinProps = { roomId: string; joinCode?: string };

const channelsJoinPropsSchema = {
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
};

export const isChannelsJoinProps = ajv.compile<ChannelsJoinProps>(channelsJoinPropsSchema);
