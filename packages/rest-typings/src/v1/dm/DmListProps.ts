import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';

export type DmListProps = PaginatedRequest<{
	fields?: string;
}>;

const dmListPropsSchema = {
	type: 'object',
	properties: {
		fields: {
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

export const isDmListProps = ajvQuery.compile<DmListProps>(dmListPropsSchema);
