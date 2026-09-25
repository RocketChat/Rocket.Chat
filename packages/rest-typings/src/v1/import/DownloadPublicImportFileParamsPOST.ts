import { ajv } from '../Ajv';

export type DownloadPublicImportFileParamsPOST = {
	fileUrl: string;
	importerKey: string;
};

const DownloadPublicImportFileParamsPostSchema = {
	type: 'object',
	properties: {
		fileUrl: {
			type: 'string',
			pattern: '^https?://',
		},
		importerKey: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['fileUrl', 'importerKey'],
};

export const isDownloadPublicImportFileParamsPOST = ajv.compile<DownloadPublicImportFileParamsPOST>(
	DownloadPublicImportFileParamsPostSchema,
);
