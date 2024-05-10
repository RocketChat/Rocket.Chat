export type OauthConfig = {
	serverURL?: string;
	identityPath?: string;
	addAutopublishFields?: {
		forLoggedInUser: string[];
		forOtherUsers: string[];
	};
	accessTokenParam?: string;
	identityTokenSentVia?: string;
	authorizePath?: string;
	tokenPath?: string;
	scope?: string;
	tokenSentVia?: string;
	usernameField?: string;
	mergeUsers?: boolean;
	responseType?: string;
};
