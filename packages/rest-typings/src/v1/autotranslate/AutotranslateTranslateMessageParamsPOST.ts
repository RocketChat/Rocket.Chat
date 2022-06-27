import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type AutotranslateTranslateMessageParamsPOST = {
	messageId: string;
	targetLanguage?: string;
};

const AutotranslateTranslateMessageParamsPostSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
		targetLanguage: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['messageId'],
	additionalProperties: false,
};

export const isAutotranslateTranslateMessageParamsPOST = ajv.compile<AutotranslateTranslateMessageParamsPOST>(
	AutotranslateTranslateMessageParamsPostSchema,
);
