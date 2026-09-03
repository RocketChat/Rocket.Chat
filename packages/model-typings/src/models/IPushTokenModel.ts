import type { AtLeast, IPushToken, IUser } from '@rocket.chat/core-typings';
import type { DeleteResult, InsertOneResult, UpdateResult, FindCursor, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IPushTokenModel extends IBaseModel<IPushToken> {
	countTokensByUserId(userId: IUser['_id']): Promise<number>;
	countGcmTokens(): Promise<number>;
	countApnTokens(): Promise<number>;
	findOneByTokenAndAppName(tokenValue: IPushToken['tokenValue'], appName: IPushToken['appName']): Promise<IPushToken | null>;
	findOneByTokenAndUserId(tokenValue: IPushToken['tokenValue'], userId: IPushToken['userId']): Promise<IPushToken | null>;
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
	removeVoipTokensByUserIdAndAuthToken(userId: IPushToken['userId'], authToken: IPushToken['authToken']): Promise<DeleteResult>;
}
