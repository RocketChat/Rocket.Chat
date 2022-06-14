import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersUpdateParamsPOST = {
	userId: string;
	data: {
		email: string;
		name: string;
		password: string;
		username: string;
		bio: string;
		nickname: string;
		statusText: string;
		active: boolean;
		roles: string[];
		joinDefaultChannels: boolean;
		requirePasswordChange: boolean;
		sendWelcomeEmail: boolean;
		verified: boolean;
		customFields?: {};
	};
};

const UsersUpdateParamsPostSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
		},
		data: {
			type: 'object',
			properties: {
				email: {
					type: 'string',
				},
				name: {
					type: 'string',
				},
				password: {
					type: 'string',
				},
				username: {
					type: 'string',
				},
				bio: {
					type: 'string',
				},
				nickname: {
					type: 'string',
				},
				statusText: {
					type: 'string',
				},
				active: {
					type: 'boolean',
				},
				roles: {
					type: 'array',
					items: {
						type: 'string',
					},
				},
				joinDefaultChannels: {
					type: 'boolean',
				},
				requirePasswordChange: {
					type: 'boolean',
				},
				sendWelcomeEmail: {
					type: 'boolean',
				},
				verified: {
					type: 'boolean',
				},
				customFields: {
					type: 'object',
					nullable: true,
				},
			},
			required: [
				'email',
				'name',
				'password',
				'username',
				'bio',
				'nickname',
				'statusText',
				'active',
				'roles',
				'joinDefaultChannels',
				'requirePasswordChange',
				'sendWelcomeEmail',
				'verified',
			],
			additionalProperties: false,
		},
	},
	required: ['userId', 'data'],
	additionalProperties: false,
};

export const isUsersUpdateParamsPOST = ajv.compile<UsersUpdateParamsPOST>(UsersUpdateParamsPostSchema);
