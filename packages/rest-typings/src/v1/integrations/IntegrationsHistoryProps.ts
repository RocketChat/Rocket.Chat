import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({ coerceTypes: true });

export type IntegrationsHistoryProps = PaginatedRequest<{ id: string }>;

const integrationsHistorySchema = {
	type: 'object',
	properties: {
		id: { type: 'string', nullable: false, minLength: 1 },
		offset: { type: 'number', nullable: true },
		count: { type: 'number', nullable: true },
		sort: { type: 'string', nullable: true },
		query: { type: 'string', nullable: true },
	},
	required: ['id'],
	additionalProperties: false,
};

export const isIntegrationsHistoryProps = ajv.compile<IntegrationsHistoryProps>(integrationsHistorySchema);
