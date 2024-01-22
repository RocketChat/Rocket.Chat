import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersGetNamesParamsGET = { userIds: string[] } | { usernames: string[] };

const UsersGetNamesParamsGETSchema = {
	oneOf: [
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
		},
	],
};

export const isUsersGetNamesParamsGETProps = ajv.compile<UsersGetNamesParamsGET>(UsersGetNamesParamsGETSchema);
