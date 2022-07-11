import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatGetThreadsListParamsGET = {
	rid: string;
	type?: string;
	text?: string;

	offset: number;
	count: number;
	sort: string;
	fields: string;
	query: string;
};

const ChatGetThreadsListParamsGETSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		type: {
			type: 'string',
			nullable: true,
		},
		text: {
			type: 'string',
			nullable: true,
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
	required: ['rid', 'offset', 'count', 'sort', 'fields', 'query'],
};

export const isChatGetThreadsListParamsGET = ajv.compile<ChatGetThreadsListParamsGET>(ChatGetThreadsListParamsGETSchema);
