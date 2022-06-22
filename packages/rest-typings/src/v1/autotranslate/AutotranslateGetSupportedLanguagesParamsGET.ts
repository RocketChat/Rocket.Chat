import type { ISupportedLanguage } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type AutotranslateGetSupportedLanguagesParamsGET = {
	targetLanguage: string;
	languages: ISupportedLanguage[];
};

const AutotranslateGetSupportedLanguagesParamsGETSchema = {
	type: 'object',
	properties: {
		targetLanguage: {
			type: 'string',
		},
		languages: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					language: {
						type: 'string',
					},
					name: {
						type: 'string',
					},
				},
				required: ['language', 'name'],
			},
		},
	},
	required: ['targetLanguage', 'languages'],
	additionalProperties: false,
};

export const isAutotranslateGetSupportedLanguagesParamsGET = ajv.compile<AutotranslateGetSupportedLanguagesParamsGET>(
	AutotranslateGetSupportedLanguagesParamsGETSchema,
);
