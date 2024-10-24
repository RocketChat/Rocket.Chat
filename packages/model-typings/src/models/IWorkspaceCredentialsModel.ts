import type { IWorkspaceCredentials } from '@rocket.chat/core-typings';
import type { DeleteResult, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IWorkspaceCredentialsModel extends IBaseModel<IWorkspaceCredentials> {
	getCredentialByScope(scope?: string): Promise<IWorkspaceCredentials | null>;
	updateCredentialByScope(credentials: { scope: string; accessToken: string; expirationDate: Date }): Promise<UpdateResult>;
	removeAllCredentials(): Promise<DeleteResult>;
}
