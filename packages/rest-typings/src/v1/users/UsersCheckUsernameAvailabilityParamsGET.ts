// TO-DO: import Ajv instance instead of creating a new one
import Ajv from 'ajv';

const ajv = new Ajv({ coerceTypes: true });

export type UsersCheckUsernameAvailabilityParamsGET = {
	username: string;
};

const UsersCheckUsernameAvailabilityParamsGETSchema = {
	type: 'object',
	properties: {
		username: {
			type: 'string',
		},
	},
	required: ['username'],
	additionalProperties: false,
};

export const isUsersCheckUsernameAvailabilityParamsGET = ajv.compile<UsersCheckUsernameAvailabilityParamsGET>(
	UsersCheckUsernameAvailabilityParamsGETSchema,
);
