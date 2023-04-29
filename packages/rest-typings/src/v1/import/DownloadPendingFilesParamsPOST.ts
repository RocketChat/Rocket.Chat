import { ajv } from '../../helpers/schemas';

export type DownloadPendingFilesParamsPOST = Record<string, unknown>;

const DownloadPendingFilesParamsPOSTSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isDownloadPendingFilesParamsPOST = ajv.compile<DownloadPendingFilesParamsPOST>(DownloadPendingFilesParamsPOSTSchema);
