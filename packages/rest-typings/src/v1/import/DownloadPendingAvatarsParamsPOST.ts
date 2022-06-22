import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type DownloadPendingAvatarsParamsPOST = {
	userId: string;
	count: number;
};

const DownloadPendingAvatarsParamsPOSTSchema = {
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

export const isDownloadPendingAvatarsParamsPOST = ajv.compile<DownloadPendingAvatarsParamsPOST>(DownloadPendingAvatarsParamsPOSTSchema);
