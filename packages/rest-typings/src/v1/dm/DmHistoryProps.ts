import type { PaginatedRequest } from '../../helpers/PaginatedRequest.js';
import { ajvQuery } from '../Ajv.js';
import { paginationQueryProperties } from '../pagination.js';

export type DmHistoryProps = PaginatedRequest<{
	roomId: string;
	latest?: string;
	oldest?: string;
	inclusive?: 'false' | 'true';
	unreads?: 'true' | 'false';
	showThreadMessages?: 'false' | 'true';
}>;

const DmHistoryPropsSchema = {
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
		...paginationQueryProperties,
		sort: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isDmHistoryProps = ajvQuery.compile<DmHistoryProps>(DmHistoryPropsSchema);
