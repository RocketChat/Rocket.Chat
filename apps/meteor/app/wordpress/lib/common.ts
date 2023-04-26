export type WordPressOauthConfig = {
	serverURL?: string;
	identityPath?: string;
	addAutopublishFields: {
		forLoggedInUser: string[];
		forOtherUsers: string[];
	};
	accessTokenParam?: string;
	identityTokenSentVia?: string;
	authorizePath?: string;
	tokenPath?: string;
	scope?: string;
};
