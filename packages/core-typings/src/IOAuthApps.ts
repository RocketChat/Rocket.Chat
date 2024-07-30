export interface IOAuthApps {
	_id: string;
	clientId: string;
	name: string;
	active: boolean;
	clientSecret: string;
	redirectUri: string;
	_createdAt: Date;
	_createdBy: {
		_id: string;
		username: string;
	};
	_updatedAt: Date;
	appId?: string;
}

export type OAuthAppsInfo = Pick<IOAuthApps, 'clientId' | 'name'>;
