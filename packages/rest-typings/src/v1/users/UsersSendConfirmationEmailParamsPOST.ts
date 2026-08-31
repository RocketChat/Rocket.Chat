// TO-DO: import Ajv instance instead of creating a new one
import { ajv } from '../Ajv';

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
