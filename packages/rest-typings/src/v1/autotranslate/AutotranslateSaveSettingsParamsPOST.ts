import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type AutotranslateSaveSettingsParamsPOST = {
	roomId: string;
	field: 'autoTranslate' | 'autoTranslateLanguage';
	value: boolean | string;
	defaultLanguage?: string;
};

const AutotranslateSaveSettingsParamsPostSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		field: {
			enum: ['autoTranslate', 'autoTranslateLanguage'],
		},
		value: {
			type: ['boolean', 'string'],
		},
		defaultLanguage: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['roomId', 'field', 'value'],
	additionalProperties: false,
};

export const isAutotranslateSaveSettingsParamsPOST = ajv.compile<AutotranslateSaveSettingsParamsPOST>(
	AutotranslateSaveSettingsParamsPostSchema,
);
