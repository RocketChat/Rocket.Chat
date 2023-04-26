export interface IAccessToken {
	token: string;
	expiresAt: Date;
}

export interface ICloudService {
	getWorkspaceAccessTokenWithScope(scope?: string): IAccessToken;
}
