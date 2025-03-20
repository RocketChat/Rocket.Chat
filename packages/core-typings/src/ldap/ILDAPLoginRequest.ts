export interface ILDAPLoginRequest {
	ldap?: boolean;
	ldapOptions?: Record<string, any>;
	username: string;
	ldapPass: string;
}
