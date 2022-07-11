import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatGetStarredMessagesParamsGET = {
	roomId: string;
	sort: Record<string, 1 | -1>;
	offset: number;
	count: number;
};

const ChatGetStarredMessagesParamsGETSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		sort: {
			type: 'object',
			additionalProperties: {
				type: 'number',
			},
			required: [],
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

export const isChatGetStarredMessagesParamsGET = ajv.compile<ChatGetStarredMessagesParamsGET>(ChatGetStarredMessagesParamsGETSchema);
