import type { ILDAPEntry } from '@rocket.chat/core-typings';
import _ from 'underscore';

export function ldapKeyExists(ldapUser: ILDAPEntry, key: string): boolean {
	return !_.isEmpty(ldapUser[key.trim()]);
}
