import Ajv from 'ajv';

const ajv = new Ajv();

export type ChannelsOpenProps = {
	roomId: string;
	query?: string; // { 'mentions._id': { $in: string[] } } | { 'starred._id': { $in: string[] } } | { pinned: boolean };
	sort?: { ts: 1 | -1 };
};

const channelsOpenPropsSchema = {
	type: 'object',
	properties: {
		roomId: { type: 'string' },
		query: { type: 'string' },
		sort: {
			type: 'object',
			properties: {
				ts: { type: 'number' },
			},
			required: ['ts'],
		},
	},

	required: ['roomId'],
	additionalProperties: false,
};

export const isChannelsOpenProps = ajv.compile<ChannelsOpenProps>(channelsOpenPropsSchema);
