import { ajv } from '../Ajv';

export type ModerationDeleteMsgHistoryParamsPOST = {
	userId: string;
	reasonForHiding?: string;
};

const ajvParams = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
		},
		reasonForHiding: {
			type: 'string',
		},
	},
	required: ['userId'],
	additionalProperties: false,
};

export const isModerationDeleteMsgHistoryParams = ajv.compile<ModerationDeleteMsgHistoryParamsPOST>(ajvParams);
