import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatUnPinMessageParamsPOST = {
	messageId: string;
};

const ChatUnPinMessageParamsPOSTSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['messageId'],
};

export const isChatUnPinMessageParamsPOST = ajv.compile<ChatUnPinMessageParamsPOST>(ChatUnPinMessageParamsPOSTSchema);
