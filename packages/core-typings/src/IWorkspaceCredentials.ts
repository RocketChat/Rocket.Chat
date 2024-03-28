import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IWorkspaceCredentials extends IRocketChatRecord {
	_id: string;
	scopes: string[];
	expirationDate: Date;
	accessToken: string;
}
