import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersGetNamesParamsGET = { userIds: string[] } | { usernames: string[] };

const UsersGetNamesParamsGETSchema = {
	anyOf: [
		{
			type: 'object',
			properties: {
				userIds: {
					type: 'array',
					items: {
						type: 'string',
					},
				},
			},
			required: ['userIds'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				usernames: {
					type: 'array',
					items: {
						type: 'string',
					},
				},
			},
			required: ['usernames'],
			additionalProperties: false,
		},
	],
};

export const isUsersGetNamesParamsGETProps = ajv.compile<UsersGetNamesParamsGET>(UsersGetNamesParamsGETSchema);
