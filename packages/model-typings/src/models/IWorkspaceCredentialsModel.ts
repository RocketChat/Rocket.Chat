import type { IWorkspaceCredentials } from '@rocket.chat/core-typings';
import type { UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IWorkspaceCredentialsModel extends IBaseModel<IWorkspaceCredentials> {
	getCredentialByScope(scope: string): Promise<IWorkspaceCredentials | null>;
	unsetCredentialByScope(scope: string): Promise<void>;
	createOrUpdateCredentialByScope(scope: string, accessToken: string, expirationDate: Date): Promise<UpdateResult>;
	removeAllCredentials(): Promise<void>;
}
