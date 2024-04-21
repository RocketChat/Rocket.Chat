import { ajv } from '../Ajv';

export type UsersSendWelcomeEmailParamsPOST = { email: string };

const UsersSendWelcomeEmailParamsPostSchema = {
	type: 'object',
	properties: {
		email: {
			type: 'string',
			format: 'email',
		},
	},
	required: ['email'],
	additionalProperties: false,
};

export const isUsersSendWelcomeEmailProps = ajv.compile<UsersSendWelcomeEmailParamsPOST>(UsersSendWelcomeEmailParamsPostSchema);
