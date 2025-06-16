import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChannelsListProps = PaginatedRequest<{ _id?: string }>;

const channelsListPropsSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
		},
		query: {
			type: 'string',
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
	required: [],
	additionalProperties: false,
};

export const isChannelsListProps = ajv.compile<ChannelsListProps>(channelsListPropsSchema);
