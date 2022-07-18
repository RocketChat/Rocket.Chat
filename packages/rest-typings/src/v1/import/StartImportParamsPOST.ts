import { ajv } from '../../Ajv';

export type StartImportParamsPOST = {
	input: string;
};

const StartImportParamsPostSchema = {
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
