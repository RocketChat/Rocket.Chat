import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersUpdateOwnBasicInfoParamsPOST = {
	data: {
		email: string;
		name: string;
		username: string;
		nickname: string;
		statusText: string;
		currentPassword: string;
		newPassword: string;
	};
	customFields?: {};
};

const UsersUpdateOwnBasicInfoParamsPostSchema = {
	type: 'object',
	properties: {
		data: {
			type: 'object',
			properties: {
				email: {
					type: 'string',
				},
				name: {
					type: 'string',
				},
				username: {
					type: 'string',
				},
				nickname: {
					type: 'string',
				},
				statusText: {
					type: 'string',
				},
				currentPassword: {
					type: 'string',
				},
				newPassword: {
					type: 'string',
				},
			},
			required: ['email', 'name', 'username', 'nickname', 'statusText', 'currentPassword', 'newPassword'],
			additionalProperties: false,
		},
		customFields: {
			type: 'object',
			nullable: true,
		},
	},
	required: ['data'],
	additionalProperties: false,
};

export const isUsersUpdateOwnBasicInfoParamsPOST = ajv.compile<UsersUpdateOwnBasicInfoParamsPOST>(UsersUpdateOwnBasicInfoParamsPostSchema);
