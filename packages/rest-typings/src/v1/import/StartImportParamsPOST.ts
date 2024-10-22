import type { IImporterShortSelection } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type StartImportParamsPOST = {
	input: IImporterShortSelection;
};

const RecordListSchema = {
	type: 'object',
	properties: {
		all: { type: 'boolean' },
		list: {
			type: 'array',
			items: { type: 'string' },
		},
	},
	required: [],
};

const StartImportParamsPostSchema = {
	type: 'object',
	properties: {
		input: {
			type: 'object',
			properties: {
				users: RecordListSchema,
				channels: RecordListSchema,
			},
			required: [],
		},
	},
	additionalProperties: false,
	required: ['input'],
};

export const isStartImportParamsPOST = ajv.compile<StartImportParamsPOST>(StartImportParamsPostSchema);
