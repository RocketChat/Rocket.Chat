import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersListStatusParamsGET = PaginatedRequest<{
	status?: 'active' | 'all' | 'deactivated';
	hasLoggedIn?: boolean;
	type?: string;
	roles?: string[];
	searchTerm?: string;
}>;

const UsersListStatusParamsGetSchema = {
	type: 'object',
	properties: {
		status: {
			type: 'string',
			enum: ['active', 'deactivated'],
		},
		hasLoggedIn: {
			type: 'boolean',
			nullable: true,
		},
		type: {
			type: 'string',
			nullable: true,
		},
		roles: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
		searchTerm: {
			type: 'string',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isUsersListStatusProps = ajv.compile<UsersListStatusParamsGET>(UsersListStatusParamsGetSchema);
