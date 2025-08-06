import { ajv } from './../Ajv';
export type AutotranslateGetSupportedLanguagesParamsGET = {
	targetLanguage: string;
};

const AutotranslateGetSupportedLanguagesParamsGETSchema = {
	type: 'object',
	properties: {
		targetLanguage: {
			type: 'string',
		},
	},
	required: ['targetLanguage'],
	additionalProperties: false,
};

export const isAutotranslateGetSupportedLanguagesParamsGET = ajv.compile<AutotranslateGetSupportedLanguagesParamsGET>(
	AutotranslateGetSupportedLanguagesParamsGETSchema,
);
