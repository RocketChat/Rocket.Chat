import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatReactParamsPOST = {
	messageId: string;
	emoji: string;
	reaction: string;
	shouldReact: boolean;
};

const ChatReactParamsPOSTSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
		emoji: {
			type: 'string',
		},
		reaction: {
			type: 'string',
		},
		shouldReact: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['messageId', 'emoji', 'reaction', 'shouldReact'],
};

export const isChatReactParamsPOST = ajv.compile<ChatReactParamsPOST>(ChatReactParamsPOSTSchema);
