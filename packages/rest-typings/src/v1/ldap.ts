// import type { TranslationKey } from '../../../client/contexts/TranslationContext';

// TODO: move to translation package
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
