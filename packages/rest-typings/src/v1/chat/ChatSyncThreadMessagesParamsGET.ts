import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatSyncThreadMessagesParamsGET = {
	tmid: string;

	query: string;
	fields: string;
	sort: string;

	updatedSince: string;
};

const ChatSyncThreadMessagesParamsGETSchema = {
	type: 'object',
	properties: {
		tmid: {
			type: 'string',
		},
		updatedSince: {
			type: 'string',
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
	required: ['tmid', 'updatedSince', 'sort', 'fields', 'query'],
};

export const isChatSyncThreadMessagesParamsGET = ajv.compile<ChatSyncThreadMessagesParamsGET>(ChatSyncThreadMessagesParamsGETSchema);
