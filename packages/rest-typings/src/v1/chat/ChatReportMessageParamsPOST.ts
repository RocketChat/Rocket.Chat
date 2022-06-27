import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatReportMessageParamsPOST = {
	messageId: string;
	description: string;
};

const ChatReportMessageParamsPOSTSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
		description: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['messageId', 'description'],
};

export const isChatReportMessageParamsPOST = ajv.compile<ChatReportMessageParamsPOST>(ChatReportMessageParamsPOSTSchema);
