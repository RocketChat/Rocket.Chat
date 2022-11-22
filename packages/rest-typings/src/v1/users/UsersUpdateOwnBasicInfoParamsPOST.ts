import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersUpdateOwnBasicInfoParamsPOST = {
	data: {
		email?: string;
		name?: string;
		username?: string;
		nickname?: string;
		statusText?: string;
		currentPassword?: string;
		newPassword?: string;
	};
	customFields?: Record<string, unknown>;
};

const UsersUpdateOwnBasicInfoParamsPostSchema = {
	type: 'object',
	properties: {
		data: {
			type: 'object',
			properties: {
				email: {
					type: 'string',
					nullable: true,
				},
				name: {
					type: 'string',
					nullable: true,
				},
				username: {
					type: 'string',
					nullable: true,
				},
				nickname: {
					type: 'string',
					nullable: true,
				},
				statusText: {
					type: 'string',
					nullable: true,
				},
				currentPassword: {
					type: 'string',
					nullable: true,
				},
				newPassword: {
					type: 'string',
					nullable: true,
				},
			},
			required: [],
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
