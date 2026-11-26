import type { PaginatedRequest } from '../../helpers/PaginatedRequest.js';
import { ajvQuery } from '../Ajv.js';
import { paginationQueryProperties } from '../pagination.js';

export type IntegrationsHistoryProps = PaginatedRequest<{ id: string }>;

const integrationsHistorySchema = {
	type: 'object',
	properties: {
		id: { type: 'string', nullable: false, minLength: 1 },
		...paginationQueryProperties,
		sort: { type: 'string', nullable: true },
	},
	required: ['id'],
	additionalProperties: false,
};

export const isIntegrationsHistoryProps = ajvQuery.compile<IntegrationsHistoryProps>(integrationsHistorySchema);
