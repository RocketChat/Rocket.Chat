export interface ISAMLGlobalSettings {
	generateUsername: boolean;
	nameOverwrite: boolean;
	mailOverwrite: boolean;
	immutableProperty: string;
	defaultUserRole: string;
	userDataFieldMap: string;
	usernameNormalize: string;
	channelsAttributeUpdate: boolean;
	includePrivateChannelsInUpdate: boolean;
}
