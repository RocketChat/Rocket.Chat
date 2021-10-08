import type { TranslationKey } from '../../../TranslationContext';

export type LDAPEndpoints = {
	'ldap.testConnection': {
		POST: () => {
			message: TranslationKey;
		};
	};
	'ldap.testSearch': {
		POST: (params: { username: string }) => {
			message: TranslationKey;
		};
	};
	'ldap.syncNow': {
		POST: () => {
			message: TranslationKey;
		};
	};
};
