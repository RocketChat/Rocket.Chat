import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatGetMessageReadReceiptsParamsGET = {
	messageId: string;
};

const ChatGetMessageReadReceiptsParamsGETSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['messageId'],
};

export const isChatGetMessageReadReceiptsParamsGET = ajv.compile<ChatGetMessageReadReceiptsParamsGET>(
	ChatGetMessageReadReceiptsParamsGETSchema,
);
