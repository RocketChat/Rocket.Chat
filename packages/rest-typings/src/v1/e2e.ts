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

// All /v1/e2e.* routes are typed by their migrated implementations
// (apps/meteor/server/api/v1/e2e.ts) via ExtractRoutesFromAPI.
export type E2eEndpoints = {};
