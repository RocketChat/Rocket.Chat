import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatGetThreadMessagesParamsGET = {
	tmid: string;

	query: string;
	fields: string;
	sort: string;

	offset: number;
	count: number;
};

const ChatGetThreadMessagesParamsGETSchema = {
	type: 'object',
	properties: {
		tmid: {
			type: 'string',
		},

		offset: {
			type: 'number',
		},
		count: {
			type: 'number',
		},
		sort: {
			type: 'string',
		},
		fields: {
			type: 'string',
		},
		query: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['tmid', 'offset', 'count', 'sort', 'fields', 'query'],
};

export const isChatGetThreadMessagesParamsGET = ajv.compile<ChatGetThreadMessagesParamsGET>(ChatGetThreadMessagesParamsGETSchema);
