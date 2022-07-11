import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatFollowMessageParamsPOST = {
	mid: string;
};

const ChatFollowMessageParamsPOSTSchema = {
	type: 'object',
	properties: {
		mid: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['mid'],
};

export const isChatFollowMessageParamsPOST = ajv.compile<ChatFollowMessageParamsPOST>(ChatFollowMessageParamsPOSTSchema);
