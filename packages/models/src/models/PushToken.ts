import type { IPushToken, IUser, AtLeast } from '@rocket.chat/core-typings';
import type { IPushTokenModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, FindOptions, IndexDescription, InsertOneResult, UpdateResult } from 'mongodb';

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
		return [{ key: { userId: 1, authToken: 1 } }, { key: { appName: 1, token: 1 } }];
	}

	countApnTokens() {
		const query = {
			'token.apn': { $exists: true },
		};

		return this.countDocuments(query);
	}

	countGcmTokens() {
		const query = {
			'token.gcm': { $exists: true },
		};

		return this.countDocuments(query);
	}

	countTokensByUserId(userId: IUser['_id']) {
		const query = {
			userId,
			$or: [{ 'token.apn': { $exists: true } }, { 'token.gcm': { $exists: true } }],
		};

		return this.countDocuments(query);
	}

	async findFirstByUserId<T extends IPushToken>(userId: IUser['_id'], options: FindOptions<IPushToken> = {}): Promise<T | null> {
		return this.findOne<T>({ userId }, options);
	}

	async insertToken(data: AtLeast<IPushToken, 'token' | 'authToken' | 'appName' | 'userId'>): Promise<InsertOneResult<IPushToken>> {
		return this.insertOne({
			enabled: true,
			createdAt: new Date(),
			...data,
		});
	}

	async refreshTokenById(
		id: IPushToken['_id'],
		data: Pick<IPushToken, 'token' | 'appName' | 'authToken' | 'userId' | 'voipToken'>,
	): Promise<UpdateResult<IPushToken>> {
		return this.updateOne(
			{ _id: id },
			{
				$set: {
					token: data.token,
					authToken: data.authToken,
					appName: data.appName,
					userId: data.userId,
					...(data.voipToken && { voipToken: data.voipToken }),
				},
				...(!data.voipToken && { $unset: { voipToken: 1 } }),
			},
		);
	}

	findOneByTokenAndAppName(token: IPushToken['token'], appName: IPushToken['appName']): Promise<IPushToken | null> {
		return this.findOne({
			token,
			appName,
		});
	}

	removeByUserIdExceptTokens(userId: string, tokens: IPushToken['authToken'][]): Promise<DeleteResult> {
		return this.deleteMany({
			userId,
			authToken: { $nin: tokens },
		});
	}

	removeDuplicateTokens(tokenData: Pick<IPushToken, '_id' | 'token' | 'appName' | 'authToken'>): Promise<DeleteResult> {
		return this.deleteMany({
			_id: { $ne: tokenData._id },
			$or: [
				{
					token: tokenData.token,
					appName: tokenData.appName,
				},
				{
					authToken: tokenData.authToken,
				},
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
			$or: [
				{
					'token.apn': token,
				},
				{
					'token.gcm': token,
				},
			],
			userId,
		});
	}
}
