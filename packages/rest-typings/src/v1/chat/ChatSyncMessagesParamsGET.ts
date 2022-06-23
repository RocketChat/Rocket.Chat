import Ajv, { JSONSchemaType } from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatSyncMessagesParamsPOST = {
	roomId: string;
	lastUpdate: string;
};

const ChatSyncMessagesParamsPostSchema: JSONSchemaType<ChatSyncMessagesParamsPOST> = {
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

export const isChatSyncMessagesParamsPOST = ajv.compile<ChatSyncMessagesParamsPOST>(ChatSyncMessagesParamsPostSchema);
