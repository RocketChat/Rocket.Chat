import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv();

export type IntegrationsListProps = PaginatedRequest<{ name?: string; type?: string; query?: string }>;

const integrationsListSchema = {
	type: 'object',
	properties: {
		count: {
			type: ['number', 'string'],
			nullable: true,
		},
		offset: {
			type: ['number', 'string'],
			nullable: true,
		},
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

export const isIntegrationsListProps = ajv.compile<IntegrationsListProps>(integrationsListSchema);
