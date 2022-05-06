export type LDAPEndpoints = {
	'ldap.testConnection': {
		POST: () => {
			message: string;
		};
	};
	'ldap.testSearch': {
		POST: (params: { username: string }) => {
			message: string;
		};
	};
	'ldap.syncNow': {
		POST: () => {
			message: string;
		};
	};
};
