import type { IOAuthRefreshToken } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IOAuthRefreshTokensModel extends IBaseModel<IOAuthRefreshToken> {
	findOneByRefreshToken(refreshToken: string, options?: FindOptions<IOAuthRefreshToken>): Promise<IOAuthRefreshToken | null>;
}
