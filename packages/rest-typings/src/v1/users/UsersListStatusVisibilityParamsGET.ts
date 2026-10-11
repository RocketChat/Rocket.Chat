import { ajvQuery } from '../Ajv';

export type UsersListStatusVisibilityParamsGET = {
	searchTerm?: string;
	count?: number;
	offset?: number;
};

const schema = {
	type: 'object',
	properties: {
		searchTerm: { type: 'string', nullable: true },
		count: { type: 'number', nullable: true },
		offset: { type: 'number', nullable: true },
	},
	additionalProperties: false,
};

export const isUsersListStatusVisibilityParamsGET = ajvQuery.compile<UsersListStatusVisibilityParamsGET>(schema);
