export interface ILDAPService {
	loginRequest(username: string, password: string): Promise<Record<string, any> | undefined>;
}
