import type { IMatrixBridgedUser } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IMatrixBridgedUserModel extends IBaseModel<IMatrixBridgedUser> {
	getExternalUserIdByLocalUserId(localUserId: string): Promise<string | null>;
	getBridgedUserByExternalUserId(externalUserId: string): Promise<IMatrixBridgedUser | null>;
	getLocalUserIdByExternalId(externalUserId: string): Promise<string | null>;
	getBridgedUserByLocalId(localUserId: string): Promise<IMatrixBridgedUser | null>;
	createOrUpdateByLocalId(localUserId: string, externalUserId: string, remote: boolean): Promise<void>;
}
