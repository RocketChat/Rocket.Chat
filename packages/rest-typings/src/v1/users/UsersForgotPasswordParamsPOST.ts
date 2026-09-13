import { ajv } from '../Ajv';

type UsersForgotPasswordParamsPOST = {
	email: string;
};

const UsersForgotPasswordParamsPostSchema = {
	type: 'object',
	properties: {
		email: { type: 'string' },
	},
	required: ['email'],
	additionalProperties: false,
};

export const isUsersForgotPasswordParamsPOST = ajv.compile<UsersForgotPasswordParamsPOST>(UsersForgotPasswordParamsPostSchema);
