import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatStarMessageParamsPOST = {
	messageId: string;
};

const ChatStarMessageParamsPOSTSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['messageId'],
};

export const isChatStarMessageParamsPOST = ajv.compile<ChatStarMessageParamsPOST>(ChatStarMessageParamsPOSTSchema);
