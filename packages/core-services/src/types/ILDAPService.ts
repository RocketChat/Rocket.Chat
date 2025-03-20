import type { LDAPLoginResult } from '@rocket.chat/core-typings';

export interface ILDAPService {
	loginRequest(username: string, password: string): Promise<LDAPLoginResult>;
	loginAuthenticatedUserRequest(username: string): Promise<LDAPLoginResult>;
	testConnection(): Promise<void>;
	testSearch(username: string): Promise<void>;
}
