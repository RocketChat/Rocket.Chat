export type LDAPEncryptionType = 'plain' | 'tls' | 'ssl';
export type LDAPSearchScope = 'base' | 'one' | 'sub';

export interface ILDAPConnectionOptions {
	host?: string;
	port: number;
	reconnect: boolean;
	timeout: number;
	connectionTimeout: number;
	idleTimeout: number;
	encryption: LDAPEncryptionType;
	caCert?: string;
	rejectUnauthorized: boolean;
	baseDN: string;
	userSearchFilter: string;
	userSearchScope: LDAPSearchScope;
	userSearchField: string;
	searchPageSize: number;
	searchSizeLimit: number;
	uniqueIdentifierField?: string;
	groupFilterEnabled: boolean;
	groupFilterObjectClass?: string;
	groupFilterGroupIdAttribute?: string;
	groupFilterGroupMemberAttribute?: string;
	groupFilterGroupMemberFormat?: string;
	groupFilterGroupName?: string;
	authentication: boolean;
	authenticationUserDN: string;
	authenticationPassword: string;
	attributesToQuery: Array<string>;
	useVariables: boolean;
	variableMap: string;
}
