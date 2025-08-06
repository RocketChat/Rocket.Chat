import { ajv } from './../Ajv';
// TO-DO: import Ajv instance instead of creating a new one
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
