import { ajvQuery } from '../Ajv';

type UsersGetPresenceParamsGET = {
	userId?: string;
	username?: string;
	user?: string;
};

const UsersGetPresenceParamsGetSchema = {
	type: 'object',
	properties: {
		userId: { type: 'string' },
		username: { type: 'string' },
		user: { type: 'string' },
	},
	additionalProperties: false,
};

export const isUsersGetPresenceParamsGET = ajvQuery.compile<UsersGetPresenceParamsGET>(UsersGetPresenceParamsGetSchema);
