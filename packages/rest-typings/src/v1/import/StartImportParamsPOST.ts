import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type StartImportParamsPOST = {
	input: string;
};

const StartImportParamsPostSchema: JSONSchemaType<StartImportParamsPOST> = {
	type: 'object',
	properties: {
		input: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['input'],
};

export const isStartImportParamsPOST = ajv.compile<StartImportParamsPOST>(StartImportParamsPostSchema);
