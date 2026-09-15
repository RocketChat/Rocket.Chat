import { ajv } from '../Ajv';

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

export const isUsersListStatusVisibilityParamsGET = ajv.compile<UsersListStatusVisibilityParamsGET>(schema);
