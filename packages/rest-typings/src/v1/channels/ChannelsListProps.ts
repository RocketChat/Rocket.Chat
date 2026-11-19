import type { PaginatedRequest } from '../../helpers/PaginatedRequest.js';
import { ajvQuery } from '../Ajv.js';
import { paginationQueryProperties } from '../pagination.js';

export type ChannelsListProps = PaginatedRequest<{
	_id?: string;
}>;

const channelsListPropsSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
		},
		...paginationQueryProperties,
		sort: {
			type: 'string',
		},
	},
	required: [],
	additionalProperties: false,
};

export const isChannelsListProps = ajvQuery.compile<ChannelsListProps>(channelsListPropsSchema);
