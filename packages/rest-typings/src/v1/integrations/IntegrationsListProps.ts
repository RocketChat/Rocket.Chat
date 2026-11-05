import type { PaginatedRequest } from '../../helpers/PaginatedRequest.js';
import { ajvQuery } from '../Ajv.js';
import { paginationQueryProperties } from '../pagination.js';

export type IntegrationsListProps = PaginatedRequest<{ name?: string; type?: string }>;

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
	},
	required: [],
	additionalProperties: false,
};

export const isIntegrationsListProps = ajvQuery.compile<IntegrationsListProps>(integrationsListSchema);
