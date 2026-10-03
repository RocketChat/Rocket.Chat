import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';

export type IntegrationsListProps = PaginatedRequest<{ name?: string; type?: string; query?: string }>;

const integrationsListSchema = {
	type: 'object',
	properties: {
		...paginationQueryProperties,
		sort: {
			type: 'string',
			nullable: true,
		},
		name: {
			type: 'string',
			nullable: true,
		},
		type: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isIntegrationsListProps = ajvQuery.compile<IntegrationsListProps>(integrationsListSchema);
