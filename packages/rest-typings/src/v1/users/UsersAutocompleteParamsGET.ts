import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersAutocompleteParamsGET = PaginatedRequest<{ selector: string }>;

const UsersAutocompleteParamsGetSchema = {
	type: 'object',
	properties: {
		selector: {
			type: 'string',
		},
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['selector'],
	additionalProperties: false,
};

export const isUsersAutocompleteProps = ajv.compile<UsersAutocompleteParamsGET>(UsersAutocompleteParamsGetSchema);
