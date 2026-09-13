import { ajv } from '../Ajv';

type UsersDeleteOwnAccountParamsPOST = {
	password: string;
	confirmRelinquish?: boolean;
};

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
