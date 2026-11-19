import { ajvQuery } from '../Ajv.js';

type UsersGetAvatarParamsGET = {
	userId?: string;
	username?: string;
	user?: string;
};

const UsersGetAvatarParamsGetSchema = {
	type: 'object',
	properties: {
		userId: { type: 'string' },
		username: { type: 'string' },
		user: { type: 'string' },
	},
	additionalProperties: false,
};

export const isUsersGetAvatarParamsGET = ajvQuery.compile<UsersGetAvatarParamsGET>(UsersGetAvatarParamsGetSchema);
