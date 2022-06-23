import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatDeleteParamsGET = {
	msgId: string;
	roomId: string;
	asUser?: boolean;
};

const ChatDeleteParamsGETSchema = {
	type: 'object',
	properties: {
		msgId: {
			type: 'string',
		},
		roomId: {
			type: 'string',
		},
		asUser: {
			type: 'boolean',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['msgId', 'roomId'],
};

export const isChatDeleteParamsGET = ajv.compile<ChatDeleteParamsGET>(ChatDeleteParamsGETSchema);
