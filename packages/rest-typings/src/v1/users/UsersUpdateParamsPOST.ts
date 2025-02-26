import type { IUserSettings } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersUpdateParamsPOST = {
	userId: string;
	data: {
		email?: string;
		name?: string;
		password?: string;
		username?: string;
		active?: boolean;
		bio?: string;
		nickname?: string;
		statusText?: string;
		roles?: string[];
		requirePasswordChange?: boolean;
		setRandomPassword?: boolean;
		sendWelcomeEmail?: boolean;
		verified?: boolean;
		customFields?: Record<string, unknown>;
		settings?: IUserSettings;
		language?: string;
		status?: string;
	};
	confirmRelinquish?: boolean;
};

const UsersUpdateParamsPostSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
			minLength: 1,
		},
		confirmRelinquish: {
			type: 'boolean',
		},
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
				password: {
					type: 'string',
					nullable: true,
				},
				username: {
					type: 'string',
					nullable: true,
				},
				bio: {
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
				active: {
					type: 'boolean',
					nullable: true,
				},
				roles: {
					type: 'array',
					items: {
						type: 'string',
					},
					nullable: true,
				},
				requirePasswordChange: {
					type: 'boolean',
					nullable: true,
				},
				setRandomPassword: {
					type: 'boolean',
					nullable: true,
				},
				sendWelcomeEmail: {
					type: 'boolean',
					nullable: true,
				},
				verified: {
					type: 'boolean',
					nullable: true,
				},
				customFields: {
					type: 'object',
					nullable: true,
				},
				status: {
					type: 'string',
					nullable: true,
				},
			},
			required: [],
			additionalProperties: false,
		},
	},
	required: ['userId', 'data'],
	additionalProperties: false,
};

export const isUsersUpdateParamsPOST = ajv.compile<UsersUpdateParamsPOST>(UsersUpdateParamsPostSchema);
