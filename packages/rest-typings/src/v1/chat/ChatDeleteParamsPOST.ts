import Ajv, { JSONSchemaType } from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatDeleteParamsPOST = {
	msgId: string;
	roomId: string;
	asUser?: boolean;
};

const ChatDeleteParamsPostSchema: JSONSchemaType<ChatDeleteParamsPOST> = {
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

export const isChatDeleteParamsPOST = ajv.compile<ChatDeleteParamsPOST>(ChatDeleteParamsPostSchema);
