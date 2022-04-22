type oauthApp = {
    active: boolean;
    clientId: string;
    clientSecret: string;
    name: string;
    redirectUri: string;
    _createdAt: Date;
    _createdBy: {
        username: string;
        _id: string;
    };
    _id: string;
    _updatedAt: Date;
}

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface Endpoints {
		'oauth-apps.list': {
			GET: (params: {}) => {
                oauthApps: oauthApp[];
                success: boolean;
			};
		};
        'oauth-apps.get': {
            GET: (params: {appId: string | undefined}) => {

            }
        }

	}
}
