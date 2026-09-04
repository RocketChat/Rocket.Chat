import { ajv } from '../Ajv';

type UsersResetAvatarParamsPOST = {
	userId?: string;
	username?: string;
	user?: string;
};

const UsersResetAvatarParamsPostSchema = {
	type: 'object',
	properties: {
		userId: { type: 'string' },
		username: { type: 'string' },
		user: { type: 'string' },
	},
	additionalProperties: false,
};

export const isUsersResetAvatarParamsPOST = ajv.compile<UsersResetAvatarParamsPOST>(UsersResetAvatarParamsPostSchema);
