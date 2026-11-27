import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';

export type DmListEveryoneProps = PaginatedRequest<{
	fields?: string;
	query?: string;
}>;

const dmListEveryonePropsSchema = {
	type: 'object',
	properties: {
		fields: {
			type: 'string',
		},
		query: {
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

export const isDmListEveryoneProps = ajvQuery.compile<DmListEveryoneProps>(dmListEveryonePropsSchema);
