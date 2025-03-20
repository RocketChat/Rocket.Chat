import type { IImportUser } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ImportAddUsersParamsPOST = {
	users: [Omit<IImportUser, '_id' | 'services' | 'customFields'>];
};

const ImportAddUsersParamsPostSchema = {
	type: 'object',
	properties: {
		users: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					username: { type: 'string', nullable: true },
					emails: {
						type: 'array',
						items: {
							type: 'string',
						},
					},
					importIds: {
						type: 'array',
						items: {
							type: 'string',
						},
					},
					name: { type: 'string', nullable: true },
					utcOffset: { type: 'number', nullable: true },
					avatarUrl: { type: 'string', nullable: true },
					deleted: { type: 'boolean', nullable: true },
					statusText: { type: 'string', nullable: true },
					roles: {
						type: 'array',
						items: {
							type: 'string',
						},
						nullable: true,
					},
					type: { type: 'string', nullable: true },
					bio: { type: 'string', nullable: true },
					password: { type: 'string', nullable: true },
				},
				required: ['emails', 'importIds'],
			},
		},
	},
	additionalProperties: false,
	required: ['users'],
};

export const isImportAddUsersParamsPOST = ajv.compile<ImportAddUsersParamsPOST>(ImportAddUsersParamsPostSchema);
