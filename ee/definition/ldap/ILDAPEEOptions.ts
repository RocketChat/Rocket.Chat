export interface ILDAPEEConnectionOptions {
	authentication: boolean;
	authenticationUserDN: string;
	authenticationPassword: string;
	userSearchFilter: string;
	groupFilterEnabled: boolean;
	groupFilterObjectClass: string;
	groupFilterGroupIdAttribute: string;
	groupFilterGroupMemberAttribute: string;
	groupFilterGroupMemberFormat: string;
	groupFilterGroupName: string;
}
