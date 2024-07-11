import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type e2eSetUserPublicAndPrivateKeysParamsPOST = {
	public_key: string;
	private_key: string;
	force?: boolean;
};

const e2eSetUserPublicAndPrivateKeysParamsPOSTSchema = {
	type: 'object',
	properties: {
		public_key: {
			type: 'string',
		},
		private_key: {
			type: 'string',
		},
		force: {
			type: 'boolean',
		},
	},
	additionalProperties: false,
	required: ['public_key', 'private_key'],
};

export const ise2eSetUserPublicAndPrivateKeysParamsPOST = ajv.compile<e2eSetUserPublicAndPrivateKeysParamsPOST>(
	e2eSetUserPublicAndPrivateKeysParamsPOSTSchema,
);
