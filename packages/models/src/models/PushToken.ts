import { pushTokenTypesWithVoip } from '@rocket.chat/core-typings';
import type { IPushToken, IUser, AtLeast } from '@rocket.chat/core-typings';
import type { IPushTokenModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, FindOptions, IndexDescription, InsertOneResult, UpdateResult, FindCursor } from 'mongodb';

import { BaseRaw } from './BaseRaw';

// The send path throws on a document it cannot route, and that throw aborts the whole loop over the
// user's devices. Documents written by an instance still running the pre-`tokenValue` schema (rolling
// upgrade, restored backup) carry no `tokenType`, so keep them out of the cursors entirely — the old
// queries filtered on `token.apn`/`token.gcm` existence and had the same effect.
const deliverableTokenTypes = [...pushTokenTypesWithVoip];

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

	async findFirstByUserId<T extends IPushToken>(userId: IUser['_id'], options: FindOptions<IPushToken> = {}): Promise<T | null> {
		return this.findOne<T>({ userId, tokenType: { $in: ['apn', 'gcm'] } }, options);
	}

	findAllTokensByUserId<T extends IPushToken>(userId: IUser['_id'], options?: FindOptions<IPushToken>): FindCursor<T> {
		return this.find<T>({ userId, tokenType: { $in: deliverableTokenTypes } }, options);
	}

	findTokensByUserIdExceptId<T extends IPushToken>(
		userId: IUser['_id'],
		idToIgnore: IPushToken['_id'],
		options?: FindOptions<IPushToken>,
	): FindCursor<T> {
		return this.find<T>({ _id: { $ne: idToIgnore }, userId, tokenType: { $in: deliverableTokenTypes } }, options);
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
}
