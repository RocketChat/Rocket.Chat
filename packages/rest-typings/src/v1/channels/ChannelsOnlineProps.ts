import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChannelsOnlineProps = { _id?: string; query?: Record<string, any> };
const channelsOnlyPropsSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};
export const isChannelsOnlineProps = ajv.compile<ChannelsOnlineProps>(channelsOnlyPropsSchema);
