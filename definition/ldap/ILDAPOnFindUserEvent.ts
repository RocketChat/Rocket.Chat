import type { ILDAPEntry } from './ILDAPEntry';

export interface ILDAPOnFindUserEvent {
	ldapUser: ILDAPEntry;
	escapedUsername: string;
}
