import { ajv } from '../Ajv';

export type UsersBlockParamsPOST = {
	rid: string;
	userId: string;
};

const UsersBlockParamsPostSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
			minLength: 1,
		},
		userId: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['rid', 'userId'],
	additionalProperties: false,
};

export const isUsersBlockParamsPOST = ajv.compile<UsersBlockParamsPOST>(UsersBlockParamsPostSchema);
