import type { IPushToken, IUser, AtLeast } from '@rocket.chat/core-typings';
import type { IPushTokenModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, IndexDescription, InsertOneResult, UpdateResult, FindCursor, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class PushTokenRaw extends BaseRaw<IPushToken> implements IPushTokenModel {
	constructor(db: Db) {
		super(db, '_raix_push_app_tokens', undefined, {
			collectionNameResolver(name) {
				return name;
			},
		});
	}

	override modelIndexes(): IndexDescription[] {
		return [{ key: { userId: 1, authToken: 1 } }, { key: { tokenValue: 1 } }, { key: { tokenType: 1 } }];
	}

	countApnTokens() {
		return this.countDocuments({ tokenType: 'apn' });
	}

	countGcmTokens() {
		return this.countDocuments({ tokenType: 'gcm' });
	}

	countTokensByUserId(userId: IUser['_id']) {
		return this.countDocuments({ userId, tokenType: { $in: ['apn', 'gcm'] } });
	}

	async findFirstByUserId<T extends Document = IPushToken, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: IUser['_id'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		return this.findOne<T, O>({ userId, tokenType: { $in: ['apn', 'gcm'] } }, options);
	}

	findAllTokensByUserId<T extends Document = IPushToken, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: IUser['_id'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		return this.find<T, O>({ userId }, options);
	}

	findTokensByUserIdExceptId<T extends Document = IPushToken, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: IUser['_id'],
		idToIgnore: IPushToken['_id'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		return this.find<T, O>({ _id: { $ne: idToIgnore }, userId }, options);
	}

	async insertToken(
		data: AtLeast<IPushToken, 'tokenType' | 'tokenValue' | 'authToken' | 'appName' | 'userId'>,
	): Promise<InsertOneResult<IPushToken>> {
		return this.insertOne({
			enabled: true,
			createdAt: new Date(),
			...data,
		});
	}

	async refreshTokenById(
		id: IPushToken['_id'],
		data: Pick<IPushToken, 'tokenType' | 'tokenValue' | 'appName' | 'authToken' | 'userId'>,
	): Promise<UpdateResult<IPushToken>> {
		return this.updateOne(
			{ _id: id },
			{
				$set: {
					tokenType: data.tokenType,
					tokenValue: data.tokenValue,
					authToken: data.authToken,
					appName: data.appName,
					userId: data.userId,
				},
			},
		);
	}

	findOneByTokenAndAppName(tokenValue: IPushToken['tokenValue'], appName: IPushToken['appName']): Promise<IPushToken | null> {
		return this.findOne({ tokenValue, appName });
	}

	findOneByTokenAndUserId(tokenValue: IPushToken['tokenValue'], userId: IPushToken['userId']): Promise<IPushToken | null> {
		return this.findOne({ tokenValue, userId });
	}

	removeByUserIdExceptTokens(userId: string, tokens: IPushToken['authToken'][]): Promise<DeleteResult> {
		return this.deleteMany({
			userId,
			authToken: { $nin: tokens },
		});
	}

	removeDuplicateTokens(tokenData: Pick<IPushToken, '_id' | 'tokenType' | 'tokenValue' | 'appName' | 'authToken'>): Promise<DeleteResult> {
		return this.deleteMany({
			_id: { $ne: tokenData._id },
			$or: [
				{ tokenValue: tokenData.tokenValue, appName: tokenData.appName },
				{ authToken: tokenData.authToken, tokenType: tokenData.tokenType },
			],
		});
	}

	removeAllByUserId(userId: string): Promise<DeleteResult> {
		return this.deleteMany({
			userId,
		});
	}

	removeAllByTokenStringAndUserId(token: string, userId: string): Promise<DeleteResult> {
		return this.deleteMany({
			tokenValue: token,
			userId,
		});
	}

	removeByTokenString(token: string): Promise<DeleteResult> {
		return this.deleteMany({ tokenValue: token });
	}

	removeVoipTokensByUserIdAndAuthToken(userId: IPushToken['userId'], authToken: IPushToken['authToken']): Promise<DeleteResult> {
		return this.deleteMany({ userId, authToken, tokenType: 'voip' });
	}
}
