import { ajv } from '../Ajv.js';

export type DownloadPendingAvatarsParamsPOST = Record<string, unknown>;

const DownloadPendingAvatarsParamsPOSTSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isDownloadPendingAvatarsParamsPOST = ajv.compile<DownloadPendingAvatarsParamsPOST>(DownloadPendingAvatarsParamsPOSTSchema);
