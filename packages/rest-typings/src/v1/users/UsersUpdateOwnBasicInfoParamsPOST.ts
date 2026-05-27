import type { IUserPhoneNumber } from '@rocket.chat/core-typings';

import { ajv } from '../Ajv';

export type UsersUpdateOwnBasicInfoParamsPOST = {
	data: {
		email?: string;
		name?: string;
		username?: string;
		nickname?: string;
		bio?: string;
		statusText?: string;
		statusType?: string;
		currentPassword?: string;
		newPassword?: string;
		phones?: IUserPhoneNumber[];
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
				bio: {
					type: 'string',
					nullable: true,
				},
				statusType: {
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
				phones: {
					type: 'array',
					nullable: true,
					items: {
						type: 'object',
						properties: {
							number: { type: 'string', format: 'basic_phone_number' },
							label: { type: 'string', nullable: true, maxLength: 50 },
							primary: { type: 'boolean', nullable: true },
						},
						required: ['number'],
						additionalProperties: false,
					},
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
