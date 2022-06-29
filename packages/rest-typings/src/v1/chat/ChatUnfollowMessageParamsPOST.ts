import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatUnfollowMessageParamsPOST = {
	mid: string;
};

const ChatUnfollowMessageParamsPOSTSchema = {
	type: 'object',
	properties: {
		mid: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['mid'],
};

export const isChatUnfollowMessageParamsPOST = ajv.compile<ChatUnfollowMessageParamsPOST>(ChatUnfollowMessageParamsPOSTSchema);
