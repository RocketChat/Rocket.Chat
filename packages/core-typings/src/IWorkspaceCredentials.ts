import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IWorkspaceCredentials extends IRocketChatRecord {
	workspaceId: string;
	workspaceSecret: string;
	workspaceSecretExpiresAt: number;
}
