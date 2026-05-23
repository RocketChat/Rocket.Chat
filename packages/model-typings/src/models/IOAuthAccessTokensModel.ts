import type { IOAuthAccessToken } from '@rocket.chat/core-typings';
import type { DeleteResult, FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IOAuthAccessTokensModel extends IBaseModel<IOAuthAccessToken> {
	findOneByAccessToken(accessToken: string, options?: FindOptions<IOAuthAccessToken>): Promise<IOAuthAccessToken | null>;
	findOneByRefreshToken(refreshToken: string, options?: FindOptions<IOAuthAccessToken>): Promise<IOAuthAccessToken | null>;
	deleteByUserId(userId: string): Promise<DeleteResult>;
	deleteByUserIds(userIds: string[]): Promise<DeleteResult>;
}
