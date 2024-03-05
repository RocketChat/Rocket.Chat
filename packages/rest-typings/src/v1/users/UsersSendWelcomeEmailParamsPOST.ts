import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersSendWelcomeEmailParamsPOST = { email: string };

const UsersSendWelcomeEmailParamsPostSchema = {
	type: 'object',
	properties: {
		email: {
			type: 'string',
		},
	},
	required: ['email'],
	additionalProperties: false,
};

export const isUsersSendWelcomeEmailProps = ajv.compile<UsersSendWelcomeEmailParamsPOST>(UsersSendWelcomeEmailParamsPostSchema);
