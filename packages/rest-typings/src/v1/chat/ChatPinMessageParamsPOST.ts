import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatPinMessageParamsPOST = {
	messageId: string;
};

const ChatPinMessageParamsPOSTSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['messageId'],
};

export const isChatPinMessageParamsPOST = ajv.compile<ChatPinMessageParamsPOST>(ChatPinMessageParamsPOSTSchema);
