import type { IOAuthAccessToken } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IOAuthAccessTokensModel extends IBaseModel<IOAuthAccessToken> {
	findOneByAccessToken(accessToken: string, options?: FindOptions<IOAuthAccessToken>): Promise<IOAuthAccessToken | null>;
	findOneByRefreshToken(refreshToken: string, options?: FindOptions<IOAuthAccessToken>): Promise<IOAuthAccessToken | null>;
}
