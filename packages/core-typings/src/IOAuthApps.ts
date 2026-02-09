import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IOAuthApps extends IRocketChatRecord {
	name: string;
	active: boolean;
	clientId: string;
	clientSecret?: string;
	redirectUri: string;
	_createdAt: Date;
	_createdBy: {
		_id: string;
		username: string;
	};
	appId?: string;
}
