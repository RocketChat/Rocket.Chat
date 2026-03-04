import { ajv } from './Ajv';

type E2eSetUserPublicAndPrivateKeysProps = {
	public_key: string;
	private_key: string;
	force?: boolean;
};

const E2eSetUserPublicAndPrivateKeysSchema = {
	type: 'object',
	properties: {
		public_key: {
			type: 'string',
		},
		private_key: {
			type: 'string',
		},
	},
	required: ['public_key', 'private_key'],
	additionalProperties: false,
};

export const isE2eSetUserPublicAndPrivateKeysProps = ajv.compile<E2eSetUserPublicAndPrivateKeysProps>(E2eSetUserPublicAndPrivateKeysSchema);

export type E2eEndpoints = {
	'/v1/e2e.setUserPublicAndPrivateKeys': {
		POST: (params: E2eSetUserPublicAndPrivateKeysProps) => void;
	};
};
