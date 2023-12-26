import type { IAppsTokens, IUser } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IAppsTokensModel extends IBaseModel<IAppsTokens> {
	countTokensByClientType(apn: boolean, gcm: boolean, userId?: IUser['_id']): Promise<number>;
}
