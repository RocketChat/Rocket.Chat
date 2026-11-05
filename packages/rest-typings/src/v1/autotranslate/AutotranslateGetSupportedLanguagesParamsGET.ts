import { ajvQuery } from '../Ajv.js';

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

export const isAutotranslateGetSupportedLanguagesParamsGET = ajvQuery.compile<AutotranslateGetSupportedLanguagesParamsGET>(
	AutotranslateGetSupportedLanguagesParamsGETSchema,
);
