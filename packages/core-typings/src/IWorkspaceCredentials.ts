import type { IRocketChatRecord } from './IRocketChatRecord';

export type IWorkspaceAvailableCredentials =
	| 'workspace_id'
	| 'workspace_name'
	| 'workspace_public_key'
	| 'workspace_registration_client_uri'
	| 'cloud_workspace_access_token'
	| 'cloud_workspace_access_token_expires_at';

export type WorkspaceCredentialType = string | Date;

/**
 * Stores all the credentials that need to be kept inside a mongo collection.
 *
 * They need to be stored in a collection, because they might be used by multiple instances of the server
 * and they need to be kept in sync, so we can't store them in memory
 */
export interface IWorkspaceCredentials extends IRocketChatRecord {
	id: IWorkspaceAvailableCredentials;
	value: WorkspaceCredentialType;
}
