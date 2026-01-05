import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UserRegisterParamsPOST = {
	username: string;
	name?: string;
	email: string;
	pass: string;
	secret?: string;
	reason?: string;
	customFields?: object;
	settings?: {
		preferences?: {
			language?: string;
		};
	};
};

const UserRegisterParamsPostSchema = {
	type: 'object',
	properties: {
		username: {
			type: 'string',
		},
		name: {
			type: 'string',
			nullable: true,
		},
		email: {
			type: 'string',
		},
		pass: {
			type: 'string',
		},
		secret: {
			type: 'string',
			nullable: true,
		},
		reason: {
			type: 'string',
			nullable: true,
		},
		customFields: {
			type: 'object',
			nullable: true,
		},
		settings: {
			type: 'object',
			properties: {
				preferences: {
					type: 'object',
					properties: {
						language: { type: 'string' },
					},
					additionalProperties: false,
				},
			},
			additionalProperties: false,
		},
	},
	required: ['username', 'email', 'pass'],
	additionalProperties: false,
};

export const isUserRegisterParamsPOST = ajv.compile<UserRegisterParamsPOST>(UserRegisterParamsPostSchema);
