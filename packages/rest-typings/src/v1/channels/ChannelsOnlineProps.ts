import { ajvQuery } from '../Ajv.js';

export type ChannelsOnlineProps = { _id: string };
const channelsOnlyPropsSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
		},
	},
	required: ['_id'],
	additionalProperties: false,
};
export const isChannelsOnlineProps = ajvQuery.compile<ChannelsOnlineProps>(channelsOnlyPropsSchema);
