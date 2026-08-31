export interface ITwoFactorChallenge {
	_id: string;
	userId: string;
	method: 'email' | 'totp';
	expireAt: Date;
	createdAt: Date;
}
