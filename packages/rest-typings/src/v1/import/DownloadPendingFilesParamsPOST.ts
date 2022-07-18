import { ajv } from '../../Ajv';

export type DownloadPendingFilesParamsPOST = {
	userId: string;
	count: number;
};

const DownloadPendingFilesParamsPOSTSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isDownloadPendingFilesParamsPOST = ajv.compile<DownloadPendingFilesParamsPOST>(DownloadPendingFilesParamsPOSTSchema);
