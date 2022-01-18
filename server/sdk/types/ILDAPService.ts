import type { LDAPLoginResult } from '../../../definition/ldap/ILDAPLoginResult';

export interface ILDAPService {
	loginRequest(username: string, password: string): Promise<LDAPLoginResult>;
	testConnection(): Promise<void>;
	testSearch(username: string): Promise<void>;
}
