import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersListStatusParamsGET = { roles: string[]; searchTerm: string } & PaginatedRequest;

const UsersListStatusParamsGetSchema = {
	type: 'object',
	properties: {
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
