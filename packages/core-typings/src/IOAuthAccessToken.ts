export interface IOAuthAccessToken {
	_id: string;
	accessToken: string;
	expires?: Date;
	clientId: string;
	userId: string;
	refreshToken?: string;
	refreshTokenExpiresAt?: Date;
}
