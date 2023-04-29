import { ajv } from '../../helpers/schemas';

export type e2eSetUserPublicAndPrivateKeysParamsPOST = {
	public_key: string;
	private_key: string;
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
	},
	additionalProperties: false,
	required: ['public_key', 'private_key'],
};

export const ise2eSetUserPublicAndPrivateKeysParamsPOST = ajv.compile<e2eSetUserPublicAndPrivateKeysParamsPOST>(
	e2eSetUserPublicAndPrivateKeysParamsPOSTSchema,
);
