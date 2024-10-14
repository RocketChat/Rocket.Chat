import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChannelsListProps = PaginatedRequest<{ query?: string }>;

const channelsListPropsSchema = {
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

export const isChannelsListProps = ajv.compile<ChannelsListProps>(channelsListPropsSchema);
