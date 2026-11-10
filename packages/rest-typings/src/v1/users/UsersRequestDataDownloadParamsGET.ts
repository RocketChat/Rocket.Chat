import { ajvQuery } from '../Ajv';

export type UsersRequestDataDownloadParamsGET = {
	fullExport?: 'true' | 'false';
};

const UsersRequestDataDownloadParamsGetSchema = {
	type: 'object',
	properties: {
		fullExport: { type: 'string', enum: ['true', 'false'], nullable: true },
	},
	additionalProperties: false,
};

export const isUsersRequestDataDownloadParamsGET = ajvQuery.compile<UsersRequestDataDownloadParamsGET>(
	UsersRequestDataDownloadParamsGetSchema,
);
