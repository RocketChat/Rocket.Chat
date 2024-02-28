import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersInfoParamsGet = ({ userId: string } | { username: string } | { importId: string }) & {
	fields?: string;
};

const UsersInfoParamsGetSchema = {
	anyOf: [
		{
			type: 'object',
			properties: {
				userId: {
					type: 'string',
				},
				fields: {
					type: 'string',
					nullable: true,
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
				fields: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['username'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				importId: {
					type: 'string',
				},
				fields: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['importId'],
			additionalProperties: false,
		},
	],
};

export const isUsersInfoParamsGetProps = ajv.compile<UsersInfoParamsGet>(UsersInfoParamsGetSchema);
