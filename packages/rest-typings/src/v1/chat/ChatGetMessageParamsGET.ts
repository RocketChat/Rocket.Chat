import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatGetMessageParamsGET = {
	msgId: string;
};

const ChatGetMessageParamsGETSchema = {
	type: 'object',
	properties: {
		msgId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['msgId'],
};

export const isChatGetMessageParamsGET = ajv.compile<ChatGetMessageParamsGET>(ChatGetMessageParamsGETSchema);
