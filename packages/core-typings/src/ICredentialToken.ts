import type { IRocketChatRecord } from './IRocketChatRecord';

export interface ICredentialToken extends IRocketChatRecord {
	userInfo: {
		username?: string;
		attributes?: any;
		profile?: Record<string, any>;
	};
	expireAt: Date;
}
