export interface IOAuthRefreshToken {
	_id: string;
	refreshToken: string;
	expires?: Date;
	clientId: string;
	userId: string;
}
