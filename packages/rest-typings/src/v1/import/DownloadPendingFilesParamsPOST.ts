import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type DownloadPendingFilesParamsPOST = {
	userId: string;
	count: number;
};

const DownloadPendingFilesParamsPOSTSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
		},
		count: {
			type: 'number',
		},
	},
	additionalProperties: false,
	required: ['userId', 'count'],
};

export const isDownloadPendingFilesParamsPOST = ajv.compile<DownloadPendingFilesParamsPOST>(DownloadPendingFilesParamsPOSTSchema);
