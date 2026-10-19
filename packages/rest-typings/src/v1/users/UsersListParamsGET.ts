import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';

export type UsersListParamsGET = PaginatedRequest<{
	fields?: string;
	query?: string;
	email?: string;
	customFields?: Record<string, string>;
	includeCustomFields?: boolean;
	username?: string;
}>;

const UsersListParamsGetSchema = {
	type: 'object',
	properties: {
		fields: { type: 'string', nullable: true },
		query: { type: 'string', nullable: true },
		...paginationQueryProperties,
		sort: { type: 'string', nullable: true },
		email: { type: 'string', minLength: 1, nullable: true },
		customFields: { type: 'object', additionalProperties: { type: 'string' } },
		includeCustomFields: { type: 'boolean' },
		username: { type: 'string', minLength: 1, nullable: true },
	},
	additionalProperties: false,
};

export const isUsersListParamsGET = ajvQuery.compile<UsersListParamsGET>(UsersListParamsGetSchema);
