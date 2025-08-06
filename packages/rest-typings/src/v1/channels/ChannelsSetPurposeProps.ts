import Ajv from 'ajv';

const ajv = new Ajv({ allowUnionTypes: true });

export type ChannelsSetPurposeProps = { roomId: string; purpose: string } | { roomName: string; purpose: string };

const channelsSetPurposePropsSchema = {
	type: 'object',
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				purpose: {
					type: 'string',
				},
			},
			required: ['roomId', 'purpose'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: {
					type: 'string',
				},
				purpose: {
					type: 'string',
				},
			},
			required: ['roomName', 'purpose'],
			additionalProperties: false,
		},
	],
};

export const isChannelsSetPurposeProps = ajv.compile<ChannelsSetPurposeProps>(channelsSetPurposePropsSchema);
