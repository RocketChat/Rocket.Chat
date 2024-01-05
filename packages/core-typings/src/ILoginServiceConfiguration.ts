export interface ILoginServiceConfiguration {
	_id: string;
	service: string;
}

export type OAuthConfiguration = {
	custom: boolean;
	clientId: string;
	secret: string;
	serverURL: string;
	tokenPath: string;
	identityPath: string;
	authorizePath: string;
	scope: string;
	accessTokenParam: string;
	buttonLabelText: string;
	buttonLabelColor: string;
	loginStyle: '' | 'redirect' | 'popup';
	buttonColor: string;
	tokenSentVia: 'header' | 'payload';
	identityTokenSentVia: 'default' | 'header' | 'payload';
	keyField: 'username' | 'email';
	usernameField: string;
	emailField: string;
	nameField: string;
	avatarField: string;
	rolesClaim: string;
	groupsClaim: string;
	channelsMap: string;
	channelsAdmin: string;
	mergeUsers: boolean;
	mergeUsersDistinctServices: boolean;
	mapChannels: boolean;
	mergeRoles: boolean;
	rolesToSync: string;
	showButton: boolean;
};

export type FacebookOAuthConfiguration = Omit<Partial<OAuthConfiguration>, 'clientId'> & {
	appId: OAuthConfiguration['clientId'];
};

export type TwitterOAuthConfiguration = Omit<Partial<OAuthConfiguration>, 'clientId'> & {
	consumerKey: OAuthConfiguration['clientId'];
};

export type LinkedinOAuthConfiguration = Partial<OAuthConfiguration> & {
	clientConfig: {
		requestPermissions?: string[];
	};
};

export type CASConfiguration = {
	enabled: boolean;
	base_url: string;
	login_url: string;
	buttonLabelText: string;
	buttonLabelColor: string;
	buttonColor: string;
	width: number;
	height: number;
	autoclose: boolean;
};

export type SAMLConfiguration = {
	buttonLabelText: string;
	buttonLabelColor: string;
	buttonColor: string;
	clientConfig: {
		provider?: string;
	};
	entryPoint: string;
	idpSLORedirectURL: string;
	usernameNormalize: 'None' | 'Lowercase';
	immutableProperty: 'Username' | 'EMail';
	generateUsername: boolean;
	debug: boolean;
	nameOverwrite: boolean;
	mailOverwrite: boolean;
	issuer: string;
	logoutBehaviour: 'SAML' | 'Local';
	defaultUserRole: string;
	secret: {
		privateKey: string;
		publicCert: string;
		cert: string;
	};
	signatureValidationType: 'All' | 'Response' | 'Assertion' | 'Either';
	userDataFieldMap: string;
	allowedClockDrift: number;
	channelsAttributeUpdate: boolean;
	includePrivateChannelsInUpdate: boolean;
	customAuthnContext: string;
	authnContextComparison: 'better' | 'exact' | 'maximum' | 'minimum';
	identifierFormat: string;
	nameIDPolicyTemplate: string;
	authnContextTemplate: string;
	authRequestTemplate: string;
	logoutResponseTemplate: string;
	logoutRequestTemplate: string;
	metadataCertificateTemplate: string;
	metadataTemplate: string;
};

export type LoginServiceConfiguration = ILoginServiceConfiguration &
	Partial<OAuthConfiguration> &
	Partial<FacebookOAuthConfiguration> &
	Partial<TwitterOAuthConfiguration> &
	Partial<LinkedinOAuthConfiguration> &
	Partial<CASConfiguration> &
	Partial<SAMLConfiguration>;
