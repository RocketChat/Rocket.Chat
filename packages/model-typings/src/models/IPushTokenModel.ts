import type { AtLeast, IPushToken, IUser } from '@rocket.chat/core-typings';
import type { DeleteResult, FindOptions, InsertOneResult, UpdateResult, FindCursor } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IPushTokenModel extends IBaseModel<IPushToken> {
	countTokensByUserId(userId: IUser['_id']): Promise<number>;
	countGcmTokens(): Promise<number>;
	countApnTokens(): Promise<number>;
	findOneByTokenAndAppName(tokenValue: IPushToken['tokenValue'], appName: IPushToken['appName']): Promise<IPushToken | null>;
	findFirstByUserId<T extends IPushToken>(userId: IUser['_id'], options?: FindOptions<IPushToken>): Promise<T | null>;
	findAllTokensByUserId<T extends IPushToken>(userId: IUser['_id'], options?: FindOptions<IPushToken>): FindCursor<T>;
	findTokensByUserIdExceptId<T extends IPushToken>(
		userId: IUser['_id'],
		idToIgnore: IPushToken['_id'],
		options?: FindOptions<IPushToken>,
	): FindCursor<T>;

	insertToken(
		data: AtLeast<IPushToken, 'tokenType' | 'tokenValue' | 'authToken' | 'appName' | 'userId'>,
	): Promise<InsertOneResult<IPushToken>>;
	refreshTokenById(
		id: IPushToken['_id'],
		data: Pick<IPushToken, 'tokenType' | 'tokenValue' | 'appName' | 'authToken' | 'userId'>,
	): Promise<UpdateResult<IPushToken>>;

	removeByUserIdExceptTokens(userId: string, tokens: IPushToken['authToken'][]): Promise<DeleteResult>;
	removeDuplicateTokens(tokenData: Pick<IPushToken, '_id' | 'tokenType' | 'tokenValue' | 'appName' | 'authToken'>): Promise<DeleteResult>;

	removeAllByUserId(userId: string): Promise<DeleteResult>;
	removeAllByTokenStringAndUserId(token: string, userId: string): Promise<DeleteResult>;
	removeByTokenString(token: string): Promise<DeleteResult>;
}
