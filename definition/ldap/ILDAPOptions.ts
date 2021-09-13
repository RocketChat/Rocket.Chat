export type LDAPLogLevel = 'disabled' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
export type LDAPEncryptionType = 'plain' | 'tls' | 'ssl';
export type LDAPSearchScope = 'base' | 'one' | 'sub';

export interface ILDAPConnectionOptions {
	host: string;
	port: number;
	reconnect: boolean;
	internalLogLevel: LDAPLogLevel;
	timeout: number;
	connectionTimeout: number;
	idleTimeout: number;
	encryption: LDAPEncryptionType;
	caCert: string;
	rejectUnauthorized: boolean;
	baseDN: string;
	userSearchFilter: string;
	userSearchScope: LDAPSearchScope;
	userSearchField: string;
	searchPageSize: number;
	searchSizeLimit: number;
	uniqueIdentifierField: string;
}
