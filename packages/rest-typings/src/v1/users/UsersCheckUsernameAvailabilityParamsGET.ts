import { ajv } from '../../helpers/schemas';

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
