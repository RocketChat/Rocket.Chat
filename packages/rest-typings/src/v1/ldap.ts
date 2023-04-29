import { ajv } from '../helpers/schemas';

type ldapTestSearchProps = {
	username: string;
};

const ldapTestSearchPropsSchema = {
	type: 'object',
	properties: {
		username: {
			type: 'string',
		},
	},
	required: ['username'],
	additionalProperties: false,
};

export const isLdapTestSearch = ajv.compile<ldapTestSearchProps>(ldapTestSearchPropsSchema);

export type LDAPEndpoints = {
	'/v1/ldap.testConnection': {
		POST: () => {
			message: string;
		};
	};
	'/v1/ldap.testSearch': {
		POST: (params: ldapTestSearchProps) => {
			message: string;
		};
	};
	'/v1/ldap.syncNow': {
		POST: () => {
			message: string;
		};
	};
};
