import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatGetSnippetedMessageByIdParamsGET = {
	messageId: string;
};

const ChatGetSnippetedMessageByIdParamsGETSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['messageId'],
};

export const isChatGetSnippetedMessageByIdParamsGET = ajv.compile<ChatGetSnippetedMessageByIdParamsGET>(
	ChatGetSnippetedMessageByIdParamsGETSchema,
);
