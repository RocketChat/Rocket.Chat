import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatSearchParamsGET = {
	roomId: string;
	searchText: string;
	offset?: number;
	count?: number;
};

const ChatSearchParamsGETSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		searchText: {
			type: 'string',
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['roomId', 'searchText'],
};

export const isChatSearchParamsGET = ajv.compile<ChatSearchParamsGET>(ChatSearchParamsGETSchema);
