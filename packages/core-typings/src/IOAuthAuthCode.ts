export interface IOAuthAuthCode {
	_id: string;
	authCode: string;
	clientId: string;
	userId: string;
	expires: Date;
	redirectUri: string;
}
