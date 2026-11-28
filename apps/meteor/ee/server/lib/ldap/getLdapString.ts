import type { ILDAPEntry } from '@rocket.chat/core-typings';

export function getLdapString(ldapUser: ILDAPEntry, key: string): string | undefined {
	const value: string | undefined = ldapUser[key.trim()];
	return value;
}
