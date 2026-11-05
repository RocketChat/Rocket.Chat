import type { IRocketChatRecord } from './IRocketChatRecord.js';

export interface IOAuthRefreshToken extends IRocketChatRecord {
	refreshToken: string;
	expires?: Date;
	clientId: string;
	userId: string;
}
