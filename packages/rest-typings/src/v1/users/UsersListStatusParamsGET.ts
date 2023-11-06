import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersListStatusParamsGET = { role: string } & PaginatedRequest<{ fields: string }>;

const UsersListStatusParamsGetSchema = {
	type: 'object',
	properties: {
		role: {
			type: 'string',
		},
	},
	required: ['role'],
	additionalProperties: false,
};

export const isUsersListStatusProps = ajv.compile<UsersListStatusParamsGET>(UsersListStatusParamsGetSchema);
