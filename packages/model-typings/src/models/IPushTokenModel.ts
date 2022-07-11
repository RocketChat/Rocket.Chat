import type { IPushToken } from '@rocket.chat/core-typings';
import type { DeleteResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IPushTokenModel extends IBaseModel<IPushToken> {
	removeByUserIdExceptTokens(userId: string, tokens: string[]): Promise<DeleteResult>;
}
