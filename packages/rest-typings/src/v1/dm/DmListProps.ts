import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';

export type DmListProps = PaginatedRequest<Record<string, never>>;

const dmListPropsSchema = {
	type: 'object',
	properties: {
		...paginationQueryProperties,
		sort: {
			type: 'string',
		},
	},
	additionalProperties: false,
};

export const isDmListProps = ajvQuery.compile<DmListProps>(dmListPropsSchema);

export type DmListEveryoneProps = DmListProps;
export const isDmListEveryoneProps = isDmListProps;
