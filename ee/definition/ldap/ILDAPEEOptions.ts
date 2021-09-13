export interface ILDAPEEConnectionOptions {
	authentication: boolean;
	authenticationUserDN: string;
	authenticationPassword: string;
	groupFilterEnabled: boolean;
	groupFilterObjectClass: string;
	groupFilterGroupIdAttribute: string;
	groupFilterGroupMemberAttribute: string;
	groupFilterGroupMemberFormat: string;
	groupFilterGroupName: string;
}
