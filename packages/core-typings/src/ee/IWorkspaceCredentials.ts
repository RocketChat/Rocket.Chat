import type { IRocketChatRecord } from '../IRocketChatRecord';

export interface IWorkspaceCredentials extends IRocketChatRecord {
	_id: string;
	scope: string;
	expirationDate: Date;
	accessToken: string;
}
