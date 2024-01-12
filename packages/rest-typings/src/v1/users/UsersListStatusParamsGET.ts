import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersListStatusParamsGET = { role?: string; searchTerm: string } & PaginatedRequest;

const UsersListStatusParamsGetSchema = {
	type: 'object',
	properties: {
		searchTerm: {
			type: 'string',
		},
		role: {
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
