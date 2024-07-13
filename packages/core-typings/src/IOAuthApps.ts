export interface IOAuthAppsInfo {
	clientId: string;
	name: string;
}

export interface IOAuthApps extends IOAuthAppsInfo {
	_id: string;
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
