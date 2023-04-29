import { ajv } from '../../helpers/schemas';

export type UsersInfoParamsGet = ({ userId: string } | { username: string }) & {
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
	],
};

export const isUsersInfoParamsGetProps = ajv.compile<UsersInfoParamsGet>(UsersInfoParamsGetSchema);
