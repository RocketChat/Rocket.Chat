import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatGetMessagesParamsGET = {
	msgId: string;
};

const ChatGetMessagesParamsGETSchema = {
	type: 'object',
	properties: {
		msgId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['msgId'],
};

export const isChatGetMessagesParamsGET = ajv.compile<ChatGetMessagesParamsGET>(ChatGetMessagesParamsGETSchema);
