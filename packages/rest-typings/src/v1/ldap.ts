export type LDAPEndpoints = {
	'/v1/ldap.testConnection': {
		POST: () => {
			message: string;
		};
	};
	'/v1/ldap.testSearch': {
		POST: (params: { username: string }) => {
			message: string;
		};
	};
	'/v1/ldap.syncNow': {
		POST: () => {
			message: string;
		};
	};
};
