import { ajvQuery } from '../Ajv';

type UsersRequestDataDownloadParamsGET = {
	fullExport?: string;
};

const UsersRequestDataDownloadParamsGetSchema = {
	type: 'object',
	properties: {
		fullExport: { type: 'string', nullable: true },
	},
	additionalProperties: false,
};

export const isUsersRequestDataDownloadParamsGET = ajvQuery.compile<UsersRequestDataDownloadParamsGET>(
	UsersRequestDataDownloadParamsGetSchema,
);
