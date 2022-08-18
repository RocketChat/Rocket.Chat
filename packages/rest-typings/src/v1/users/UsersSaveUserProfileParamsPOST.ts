import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersSaveUserProfileParamsPOST = {
	userData: {
		email?: string;
		realname?: string;
		username?: string;
		nickname?: string;
		statusText?: string;
		statusType?: string;
		bio?: string;
		typedPassword?: string;
		newPassword?: string;
	};
	customFields?: Record<string, unknown>;
};

const UsersSaveUserProfileParamsPostSchema = {
	type: 'object',
	properties: {
		userData: {
			type: 'object',
			properties: {
				email: {
					type: 'string',
					nullable: true,
				},
				realname: {
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
				statusType: {
					type: 'string',
					nullable: true,
				},
				bio: {
					type: 'string',
					nullable: true,
				},
				typedPassword: {
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

export const isUsersSaveUserProfileParamsPOST = ajv.compile<UsersSaveUserProfileParamsPOST>(UsersSaveUserProfileParamsPostSchema);
