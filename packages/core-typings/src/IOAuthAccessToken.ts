import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IOAuthAccessToken extends IRocketChatRecord {
	accessToken: string;
	expires?: Date;
	clientId: string;
	userId: string;
	refreshToken?: string;
	refreshTokenExpiresAt?: Date;
}
