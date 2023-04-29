import { ajv } from '../../helpers/schemas';

export type UsersSendConfirmationEmailParamsPOST = {
	email: string;
};

const UsersSendConfirmationEmailParamsPOSTSchema = {
	type: 'object',
	properties: {
		email: {
			type: 'string',
		},
	},
	required: ['email'],
	additionalProperties: false,
};

export const isUsersSendConfirmationEmailParamsPOST = ajv.compile<UsersSendConfirmationEmailParamsPOST>(
	UsersSendConfirmationEmailParamsPOSTSchema,
);
