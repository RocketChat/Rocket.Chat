import { ajv } from '../../helpers/schemas';

export type UserRegisterParamsPOST = {
	username: string;
	name?: string;
	email: string;
	pass: string;
	secret?: string;
	reason?: string;
};

const UserRegisterParamsPostSchema = {
	type: 'object',
	properties: {
		username: {
			type: 'string',
		},

		name: {
			type: 'string',
			nullable: true,
		},
		email: {
			type: 'string',
		},
		pass: {
			type: 'string',
		},
		secret: {
			type: 'string',
			nullable: true,
		},
		reason: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['username', 'email', 'pass'],
	additionalProperties: false,
};

export const isUserRegisterParamsPOST = ajv.compile<UserRegisterParamsPOST>(UserRegisterParamsPostSchema);
