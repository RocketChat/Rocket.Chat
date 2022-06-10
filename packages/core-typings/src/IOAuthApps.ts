export interface IOAuthApps {
	_id: string;

	name: string;
	active: boolean;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	_createdAt: Date;
	_createdBy: {
		_id: string;
		username: string;
	};
}
