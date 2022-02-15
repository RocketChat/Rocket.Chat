import Ajv, { JSONSchemaType } from 'ajv';

import type { TranslationKey } from '../../../client/contexts/TranslationContext';

const ajv = new Ajv();

type ldapTestSearchProps = {
	username: string;
};

const ldapTestSearchPropsSchema: JSONSchemaType<ldapTestSearchProps> = {
	type: 'object',
	properties: {
		username: {
			type: 'string',
		},
	},
	required: ['username'],
	additionalProperties: false,
};

export const isLdapTestSearch = ajv.compile(ldapTestSearchPropsSchema);

export type LDAPEndpoints = {
	'ldap.testConnection': {
		POST: () => {
			message: TranslationKey;
		};
	};
	'ldap.testSearch': {
		POST: (params: ldapTestSearchProps) => {
			message: TranslationKey;
		};
	};
	'ldap.syncNow': {
		POST: () => {
			message: TranslationKey;
		};
	};
};
