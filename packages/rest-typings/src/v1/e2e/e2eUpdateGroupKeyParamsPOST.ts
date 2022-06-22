import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type e2eUpdateGroupKeyParamsGET = {
	uid: string;
	rid: string;
	key: string;
};

const e2eUpdateGroupKeyParamsGETSchema = {
	type: 'object',
	properties: {
		uid: {
			type: 'string',
		},
		rid: {
			type: 'string',
		},
		key: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['uid', 'rid', 'key'],
};

export const ise2eUpdateGroupKeyParamsGET = ajv.compile<e2eUpdateGroupKeyParamsGET>(e2eUpdateGroupKeyParamsGETSchema);
