import type { IWorkspaceAvailableCredentials, IWorkspaceCredentials } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IWorkspaceCredentialsModel extends IBaseModel<IWorkspaceCredentials> {
	getCredentialById(id: 'cloud_workspace_access_token_expires_at'): Promise<{ value: Date } | null>;
	getCredentialById(id: Omit<IWorkspaceAvailableCredentials, 'cloud_workspace_access_token_expires_at'>): Promise<{ value: string } | null>;

	updateCredential(id: 'cloud_workspace_access_token_expires_at', value: Date): Promise<void>;
	updateCredential(id: Omit<IWorkspaceAvailableCredentials, 'cloud_workspace_access_token_expires_at'>, value: string): Promise<void>;

	unsetCredentialValue(id: IWorkspaceAvailableCredentials): Promise<void>;
}
