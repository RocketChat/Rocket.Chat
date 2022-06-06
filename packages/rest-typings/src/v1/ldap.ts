import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

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
	'ldap.testConnection': {
		POST: () => {
			message: string;
		};
	};
	'ldap.testSearch': {
		POST: (params: ldapTestSearchProps) => {
			message: string;
		};
	};
	'ldap.syncNow': {
		POST: () => {
			message: string;
		};
	};
};
