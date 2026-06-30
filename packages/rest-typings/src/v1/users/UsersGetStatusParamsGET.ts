import { ajvQuery } from '../Ajv';

type UsersGetStatusParamsGET = {
	userId?: string;
	username?: string;
	user?: string;
};

const UsersGetStatusParamsGetSchema = {
	type: 'object',
	properties: {
		userId: { type: 'string' },
		username: { type: 'string' },
		user: { type: 'string' },
	},
	additionalProperties: false,
};

export const isUsersGetStatusParamsGET = ajvQuery.compile<UsersGetStatusParamsGET>(UsersGetStatusParamsGetSchema);
