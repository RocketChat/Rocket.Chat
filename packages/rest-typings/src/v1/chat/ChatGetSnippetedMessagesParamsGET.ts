import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatGetSnippetedMessagesParamsGET = {
	roomId: string;
	sort: string;
	offset: number;
	count: number;
};

const ChatGetSnippetedMessagesParamsGETSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		sort: {
			type: 'string',
		},
		offset: {
			type: 'number',
		},
		count: {
			type: 'number',
		},
	},
	additionalProperties: false,
	required: ['roomId', 'sort', 'offset', 'count'],
};

export const isChatGetSnippetedMessagesParamsGET = ajv.compile<ChatGetSnippetedMessagesParamsGET>(ChatGetSnippetedMessagesParamsGETSchema);
