import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatSendMessageParamsPOST = {
	message: string;
};

const ChatSendMessageParamsPOSTSchema = {
	type: 'object',
	properties: {
		message: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['message'],
};

export const isChatSendMessageParamsPOST = ajv.compile<ChatSendMessageParamsPOST>(ChatSendMessageParamsPOSTSchema);
