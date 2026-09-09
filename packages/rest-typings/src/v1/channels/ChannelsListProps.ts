import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';

export type ChannelsListProps = PaginatedRequest<{
	_id?: string;
	customFields?: string;
	/* deprecated */
	fields?: string;
}>;

const channelsListPropsSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
		},
		customFields: {
			type: 'string',
			minLength: 1,
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
		fields: {
			type: 'string',
		},
	},
	required: [],
	additionalProperties: false,
};

export const isChannelsListProps = ajvQuery.compile<ChannelsListProps>(channelsListPropsSchema);
