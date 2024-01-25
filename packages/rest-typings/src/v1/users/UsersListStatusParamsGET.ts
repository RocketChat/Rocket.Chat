import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersListStatusParamsGET = {
	status: 'active' | 'all' | 'deactivated' | 'pending';
	roles: string[];
	searchTerm: string;
} & PaginatedRequest;

const UsersListStatusParamsGetSchema = {
	type: 'object',
	properties: {
		status: {
			type: 'string',
			enum: ['active', 'all', 'deactivated', 'pending'],
		},
		roles: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		searchTerm: {
			type: 'string',
		},
		sort: {
			type: 'string',
		},
		count: {
			type: 'number',
		},
		offset: {
			type: 'number',
		},
	},
	additionalProperties: false,
};

export const isUsersListStatusProps = ajv.compile<UsersListStatusParamsGET>(UsersListStatusParamsGetSchema);
