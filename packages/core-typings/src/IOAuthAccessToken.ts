export interface IOAuthAccessToken {
	_id: string;
	accessToken: string;
	refreshToken?: string;
	accessTokenExpiresAt?: Date;
	refreshTokenExpiresAt?: Date;
	clientId: string;
	userId: string;
}
