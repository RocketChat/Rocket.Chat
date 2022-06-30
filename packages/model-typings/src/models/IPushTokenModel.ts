import type { IPushToken } from '@rocket.chat/core-typings';
import type { DeleteWriteOpResultObject } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IPushTokenModel extends IBaseModel<IPushToken> {
	removeByUserIdExceptTokens(userId: string, tokens: string[]): Promise<DeleteWriteOpResultObject>;
}
