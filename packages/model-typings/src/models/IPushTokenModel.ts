import type { AtLeast, IPushToken, IUser } from '@rocket.chat/core-typings';
import type { DeleteResult, FindOptions, InsertOneResult, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IPushTokenModel extends IBaseModel<IPushToken> {
	countTokensByUserId(userId: IUser['_id']): Promise<number>;
	countGcmTokens(): Promise<number>;
	countApnTokens(): Promise<number>;
	findOneByTokenAndAppName(token: IPushToken['token'], appName: IPushToken['appName']): Promise<IPushToken | null>;
	findFirstByUserId<T extends IPushToken>(userId: IUser['_id'], options?: FindOptions<IPushToken>): Promise<T | null>;

	insertToken(data: AtLeast<IPushToken, 'token' | 'authToken' | 'appName' | 'userId'>): Promise<InsertOneResult<IPushToken>>;
	refreshTokenById(
		id: IPushToken['_id'],
		data: Pick<IPushToken, 'token' | 'appName' | 'authToken' | 'userId' | 'voipToken'>,
	): Promise<UpdateResult<IPushToken>>;

	removeByUserIdExceptTokens(userId: string, tokens: IPushToken['authToken'][]): Promise<DeleteResult>;
	removeDuplicateTokens(tokenData: Pick<IPushToken, '_id' | 'token' | 'appName' | 'authToken'>): Promise<DeleteResult>;

	removeAllByUserId(userId: string): Promise<DeleteResult>;
	removeAllByTokenStringAndUserId(token: string, userId: string): Promise<DeleteResult>;
}
