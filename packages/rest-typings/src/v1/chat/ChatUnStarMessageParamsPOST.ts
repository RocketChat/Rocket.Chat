import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatUnStarMessageParamsPOST = {
	messageId: string;
};

const ChatUnStarMessageParamsPOSTSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['messageId'],
};

export const isChatUnStarMessageParamsPOST = ajv.compile<ChatUnStarMessageParamsPOST>(ChatUnStarMessageParamsPOSTSchema);
