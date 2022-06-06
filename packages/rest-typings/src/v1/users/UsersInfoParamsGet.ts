import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersInfoParamsGet = { userId: string } | { username: string };

const UsersInfoParamsGetSchema = {
	anyOf: [
		{
			type: 'object',
			properties: {
				userId: {
					type: 'string',
				},
			},
			required: ['userId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				username: {
					type: 'string',
				},
			},
			required: ['username'],
			additionalProperties: false,
		},
	],
};

export const isUsersInfoParamsGetProps = ajv.compile<UsersInfoParamsGet>(UsersInfoParamsGetSchema);
