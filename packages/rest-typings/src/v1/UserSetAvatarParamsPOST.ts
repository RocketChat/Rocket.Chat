import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UserSetAvatarParamsPOST = {
	avatarUrl: string;
	userId: string;
	username: string;
};

const UserSetAvatarParamsPostSchema = {
	type: 'object',
	properties: {
		avatarUrl: {
			type: 'string',
		},
		userId: {
			type: 'string',
		},
		username: {
			type: 'string',
		},
	},
	required: ['avatarUrl', 'userId', 'username'],
	additionalProperties: false,
};

export const isUserSetAvatarParamsPOST = ajv.compile<UserSetAvatarParamsPOST>(UserSetAvatarParamsPostSchema);
