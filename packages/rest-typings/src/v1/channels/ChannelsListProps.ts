import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';

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
