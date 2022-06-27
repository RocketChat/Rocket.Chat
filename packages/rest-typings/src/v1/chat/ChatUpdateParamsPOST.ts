import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatUpdateParamsPOST = {
	roomId: string;
	msgId: string;
	text: string;
};

const ChatUpdateParamsPOSTSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		msgId: {
			type: 'string',
		},
		text: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['roomId', 'msgId', 'text'],
};

export const isChatUpdateParamsPOST = ajv.compile<ChatUpdateParamsPOST>(ChatUpdateParamsPOSTSchema);
