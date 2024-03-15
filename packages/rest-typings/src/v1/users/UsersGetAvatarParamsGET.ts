import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersGetAvatarParamsGET = { userId?: string; username?: string; user?: string };

const UsersGetAvatarParamsGetSchema = {
	type: 'object',
	properties: {
		userId: { type: 'string', nullable: true },
		username: { type: 'string', nullable: true },
		user: { type: 'string', nullable: true },
	},
	anyOf: [{ required: ['userId'] }, { required: ['username'] }, { required: ['username'] }],
	additionalProperties: false,
};

export const isUsersGetAvatarParamsGET = ajv.compile<UsersGetAvatarParamsGET>(UsersGetAvatarParamsGetSchema);
