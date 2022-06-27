import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatSyncMessagesParamsGET = {
	roomId: string;
	lastUpdate: string;
};

const ChatSyncMessagesParamsGETSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		lastUpdate: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['roomId', 'lastUpdate'],
};

export const isChatSyncMessagesParamsGET = ajv.compile<ChatSyncMessagesParamsGET>(ChatSyncMessagesParamsGETSchema);
