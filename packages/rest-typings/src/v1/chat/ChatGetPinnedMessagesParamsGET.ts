import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatGetPinnedMessagesParamsGET = {
	roomId: string;
	offset: number;
	count: number;
};

const ChatGetPinnedMessagesParamsGETSchema = {
	type: 'object',
	properties: {
		roomId: {
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
	required: ['roomId', 'offset', 'count'],
};

export const isChatGetPinnedMessagesParamsGET = ajv.compile<ChatGetPinnedMessagesParamsGET>(ChatGetPinnedMessagesParamsGETSchema);
