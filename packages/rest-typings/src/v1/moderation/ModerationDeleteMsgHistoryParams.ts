import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ModerationDeleteMsgHistoryParams = {
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

export const isModerationDeleteMsgHistoryParams = ajv.compile<ModerationDeleteMsgHistoryParams>(ajvParams);
