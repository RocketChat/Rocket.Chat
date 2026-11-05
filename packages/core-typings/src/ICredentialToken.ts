import type { IRocketChatRecord } from './IRocketChatRecord.js';

export interface ICredentialToken extends IRocketChatRecord {
	userInfo: {
		username?: string;
		attributes?: any;
		profile?: Record<string, any>;
	};
	expireAt: Date;
}
