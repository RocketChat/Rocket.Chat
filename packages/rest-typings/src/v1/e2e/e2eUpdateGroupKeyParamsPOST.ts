import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type e2eUpdateGroupKeyParamsPOST = {
	uid: string;
	rid: string;
	key: string;
};

const e2eUpdateGroupKeyParamsPOSTSchema = {
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

export const ise2eUpdateGroupKeyParamsPOST = ajv.compile<e2eUpdateGroupKeyParamsPOST>(e2eUpdateGroupKeyParamsPOSTSchema);
