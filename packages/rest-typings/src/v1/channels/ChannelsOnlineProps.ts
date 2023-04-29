import { ajv } from '../../helpers/schemas';

export type ChannelsOnlineProps = { query?: Record<string, any> };
const channelsOnlyPropsSchema = {
	type: 'object',
	properties: {
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};
export const isChannelsOnlineProps = ajv.compile<ChannelsOnlineProps>(channelsOnlyPropsSchema);
