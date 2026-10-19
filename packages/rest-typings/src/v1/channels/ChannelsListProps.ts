import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';

export type ChannelsListProps = PaginatedRequest<{
	_id?: string;
	/* deprecated */
	fields?: string;
}>;

const channelsListPropsSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
		},
		query: {
			type: 'string',
		},
		...paginationQueryProperties,
		sort: {
			type: 'string',
		},
		fields: {
			type: 'string',
		},
	},
	required: [],
	additionalProperties: false,
};

export const isChannelsListProps = ajvQuery.compile<ChannelsListProps>(channelsListPropsSchema);
