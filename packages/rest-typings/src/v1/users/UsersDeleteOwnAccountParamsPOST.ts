import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersDeleteOwnAccountParamsPOST = { password: string; confirmRelinquish?: boolean };

const UsersDeleteOwnAccountParamsPostSchema = {
	type: 'object',
	properties: {
		password: { type: 'string' },
		confirmRelinquish: { type: 'boolean', nullable: true },
	},
	required: ['password'],
	additionalProperties: false,
};

export const isUsersDeleteOwnAccountParamsPOST = ajv.compile<UsersDeleteOwnAccountParamsPOST>(UsersDeleteOwnAccountParamsPostSchema);
