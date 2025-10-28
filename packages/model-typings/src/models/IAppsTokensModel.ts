import type { IAppsTokens, IUser } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IAppsTokensModel extends IBaseModel<IAppsTokens> {
	countTokensByUserId(userId: IUser['_id']): Promise<number>;
	countGcmTokens(): Promise<number>;
	countApnTokens(): Promise<number>;
}
