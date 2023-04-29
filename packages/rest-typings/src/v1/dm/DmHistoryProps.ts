import { ajv } from '../../helpers/schemas';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

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

export const isDmHistoryProps = ajv.compile<DmHistoryProps>(DmHistoryPropsSchema);
