import type { AtLeast, IPushToken, IUser } from '@rocket.chat/core-typings';
import type { DeleteResult, InsertOneResult, UpdateResult, FindCursor, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IPushTokenModel extends IBaseModel<IPushToken> {
	countTokensByUserId(userId: IUser['_id']): Promise<number>;
	countGcmTokens(): Promise<number>;
	countApnTokens(): Promise<number>;
	findOneByTokenAndAppName(token: IPushToken['token'], appName: IPushToken['appName']): Promise<IPushToken | null>;
	findFirstByUserId<T extends Document = IPushToken, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: IUser['_id'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findAllTokensByUserId<T extends Document = IPushToken, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: IUser['_id'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findTokensByUserIdExceptId<T extends Document = IPushToken, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: IUser['_id'],
		idToIgnore: IPushToken['_id'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	insertToken(data: AtLeast<IPushToken, 'token' | 'authToken' | 'appName' | 'userId'>): Promise<InsertOneResult<IPushToken>>;
	refreshTokenById(
		id: IPushToken['_id'],
		data: Pick<IPushToken, 'token' | 'appName' | 'authToken' | 'userId' | 'voipToken'>,
	): Promise<UpdateResult<IPushToken>>;

	removeByUserIdExceptTokens(userId: string, tokens: IPushToken['authToken'][]): Promise<DeleteResult>;
	removeDuplicateTokens(tokenData: Pick<IPushToken, '_id' | 'token' | 'appName' | 'authToken'>): Promise<DeleteResult>;

	removeAllByUserId(userId: string): Promise<DeleteResult>;
	removeAllByTokenStringAndUserId(token: string, userId: string): Promise<DeleteResult>;
	removeOrUnsetByTokenString(token: string): Promise<void>;
}
