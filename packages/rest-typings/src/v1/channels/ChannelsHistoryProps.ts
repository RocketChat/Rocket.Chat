import Ajv from 'ajv';

const ajv = new Ajv({ coerceTypes: true });

export type ChannelsHistoryProps = {
	roomId: string;
	latest?: string;
	showThreadMessages?: 'false' | 'true';
	oldest?: string;
	unreads?: 'true' | 'false';
	inclusive?: 'false' | 'true';
};

const channelsHistoryPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			minLength: 1,
		},
		latest: {
			type: 'string',
			minLength: 1,
		},
		showThreadMessages: {
			type: 'string',
			enum: ['false', 'true'],
		},
		oldest: {
			type: 'string',
			minLength: 1,
		},
		inclusive: {
			type: 'string',
			enum: ['false', 'true'],
		},
		unreads: {
			type: 'string',
			enum: ['true', 'false'],
		},
		count: {
			type: 'number',
		},
		offset: {
			type: 'number',
		},
		sort: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isChannelsHistoryProps = ajv.compile<ChannelsHistoryProps>(channelsHistoryPropsSchema);
