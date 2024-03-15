import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersDeleteParamsPOST = { userId?: string; username?: string; user?: string; confirmRelinquish?: boolean };

const UsersDeleteParamsPostSchema = {
	type: 'object',
	properties: {
		userId: { type: 'string', nullable: true },
		username: { type: 'string', nullable: true },
		user: { type: 'string', nullable: true },
		confirmRelinquish: { type: 'boolean' },
	},
	anyOf: [{ required: ['userId'] }, { required: ['username'] }, { required: ['username'] }],
	additionalProperties: false,
};

export const isUsersDeleteParamsPOST = ajv.compile<UsersDeleteParamsPOST>(UsersDeleteParamsPostSchema);
