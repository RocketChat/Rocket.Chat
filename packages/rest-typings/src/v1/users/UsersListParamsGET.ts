import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';

export type UsersListParamsGET = PaginatedRequest<{
	fields?: string;
	query?: string;
}>;

const UsersListParamsGetSchema = {
	type: 'object',
	properties: {
		fields: { type: 'string', nullable: true },
		query: { type: 'string', nullable: true },
		count: { type: 'number', nullable: true },
		offset: { type: 'number', nullable: true },
		sort: { type: 'string', nullable: true },
	},
	additionalProperties: false,
};

export const isUsersListParamsGET = ajvQuery.compile<UsersListParamsGET>(UsersListParamsGetSchema);
