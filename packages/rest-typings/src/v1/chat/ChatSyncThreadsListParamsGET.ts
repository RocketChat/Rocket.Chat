import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatSyncThreadsListParamsGET = {
	rid: string;
	query: string;
	fields: string;
	sort: string;
	updatedSince: string;
};

const ChatSyncThreadsListParamsGETSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		query: {
			type: 'string',
		},
		fields: {
			type: 'string',
		},
		sort: {
			type: 'string',
		},
		updatedSince: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['rid', 'query', 'fields', 'sort', 'updatedSince'],
};

export const isChatSyncThreadsListParamsGET = ajv.compile<ChatSyncThreadsListParamsGET>(ChatSyncThreadsListParamsGETSchema);
