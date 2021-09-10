import type { ILDAPEntry } from './ILDAPEntry';
import type { IUser } from '../IUser';

export interface ILDAPOnLoginEvent {
	ldapUser: ILDAPEntry;
	user?: IUser;
	password?: string;
}
