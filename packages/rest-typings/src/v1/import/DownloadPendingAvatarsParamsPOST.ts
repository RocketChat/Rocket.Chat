import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type DownloadPendingAvatarsParamsPOST = {};

const DownloadPendingAvatarsParamsPOSTSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isDownloadPendingAvatarsParamsPOST = ajv.compile<DownloadPendingAvatarsParamsPOST>(DownloadPendingAvatarsParamsPOSTSchema);
