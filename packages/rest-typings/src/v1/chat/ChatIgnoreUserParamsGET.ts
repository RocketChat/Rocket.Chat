import Ajv, { JSONSchemaType } from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatIgnoreUserParamsGET = {
	rid: string;
	userId: string;
	ignore: 'true' | 'false';
};

const ChatIgnoreUserParamsGETSchema: JSONSchemaType<ChatIgnoreUserParamsGET> = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		userId: {
			type: 'string',
		},
		ignore: {
			type: 'string',
			enum: ['true', 'false'],
		},
	},
	additionalProperties: false,
	required: ['rid', 'userId', 'ignore'],
};

export const isChatIgnoreUserParamsGET = ajv.compile<ChatIgnoreUserParamsGET>(ChatIgnoreUserParamsGETSchema);
