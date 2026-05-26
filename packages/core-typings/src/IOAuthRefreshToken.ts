import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IOAuthRefreshToken extends IRocketChatRecord {
	refreshToken: string;
	expires?: Date;
	clientId: string;
	userId: string;
}
