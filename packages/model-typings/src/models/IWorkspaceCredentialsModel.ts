import type { IWorkspaceCredentials } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

// type SaveRegistrationDataDTO = {
// 	workspaceId: IWorkspaceCredentials['workspaceId'];
// 	workspaceSecret: IWorkspaceCredentials['workspaceSecret'];
// 	workspaceSecretExpiresAt: IWorkspaceCredentials['workspaceSecretExpiresAt'];
// };

export interface IWorkspaceCredentialsModel extends IBaseModel<IWorkspaceCredentials> {
	getWorkspaceCredentialsByWorkspaceId(workspaceId: string): Promise<IWorkspaceCredentials | null>;
	// saveRegistrationData(dto: SaveRegistrationDataDTO): Promise<void>;
}
