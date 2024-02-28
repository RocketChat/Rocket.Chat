import { ajv } from '../Ajv';

export type ModerationDeleteMsgHistoryParamsPOST = {
	userId: string;
	reason?: string;
};

const ajvParams = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
			nullable: false,
			minLength: 1,
		},
		reason: {
			type: 'string',
		},
	},
	required: ['userId'],
	additionalProperties: false,
};

export const isModerationDeleteMsgHistoryParams = ajv.compile<ModerationDeleteMsgHistoryParamsPOST>(ajvParams);
