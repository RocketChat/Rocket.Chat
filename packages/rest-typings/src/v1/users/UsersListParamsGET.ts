import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';

export type UsersListParamsGET = PaginatedRequest<{
	email?: string;
}>;

const UsersListParamsGetSchema = {
	type: 'object',
	properties: {
		count: { type: 'number', nullable: true },
		offset: { type: 'number', nullable: true },
		sort: { type: 'string', nullable: true },
		email: { type: 'string', minLength: 1, nullable: true },
	},
	additionalProperties: false,
};

export const isUsersListParamsGET = ajvQuery.compile<UsersListParamsGET>(UsersListParamsGetSchema);
