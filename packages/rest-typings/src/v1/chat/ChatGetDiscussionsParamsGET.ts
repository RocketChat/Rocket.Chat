import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatGetDiscussionsParamsGET = {
	roomId: string;
	text?: string;
	sort: string;
	offset: number;
	count: number;
};

const ChatGetDiscussionsParamsGETSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		text: {
			type: 'string',
			nullable: true,
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

export const isChatGetDiscussionsParamsGET = ajv.compile<ChatGetDiscussionsParamsGET>(ChatGetDiscussionsParamsGETSchema);
