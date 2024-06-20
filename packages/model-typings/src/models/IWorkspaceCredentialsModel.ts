import type { IWorkspaceCredentials } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IWorkspaceCredentialsModel extends IBaseModel<IWorkspaceCredentials> {
	getCredentialByScope(scope: string): Promise<IWorkspaceCredentials | null>;
	unsetCredentialByScope(scope: string): Promise<void>;
	updateCredentialByScope(scope: string, accessToken: string, expirationDate: Date): Promise<void>;
	removeAllCredentials(): Promise<void>;
}
