import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatGetDeletedMessagesParamsGET = {
	roomId: string;
	since: string;
	offset: number;
	count: number;
};

const ChatGetDeletedMessagesParamsGETSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		since: {
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
	required: ['roomId', 'since', 'offset', 'count'],
};

export const isChatGetDeletedMessagesParamsGET = ajv.compile<ChatGetDeletedMessagesParamsGET>(ChatGetDeletedMessagesParamsGETSchema);
