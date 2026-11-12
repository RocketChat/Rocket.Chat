import type { IRocketChatRecord } from '../IRocketChatRecord.js';

export interface IWorkspaceCredentials extends IRocketChatRecord {
	scope: string;
	expirationDate: Date;
	accessToken: string;
}
