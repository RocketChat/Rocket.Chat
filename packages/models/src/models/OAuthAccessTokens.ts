import type { IOAuthAccessToken, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IOAuthAccessTokensModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Db, Collection, DeleteResult, IndexDescription, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class OAuthAccessTokensRaw extends BaseRaw<IOAuthAccessToken> implements IOAuthAccessTokensModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IOAuthAccessToken>>) {
		super(db, 'oauth_access_tokens', trash);
	}

	override modelIndexes(): IndexDescription[] {
		return [
			{ key: { accessToken: 1 } },
			{ key: { refreshToken: 1 } },
			{ key: { userId: 1 } },
			{ key: { expires: 1 }, expireAfterSeconds: 60 * 60 * 24 * 30 },
			{ key: { refreshTokenExpiresAt: 1 }, expireAfterSeconds: 60 * 60 * 24 * 30 },
		];
	}

	async findOneByAccessToken<T extends Document = IOAuthAccessToken, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		accessToken: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		if (typeof accessToken !== 'string' || !accessToken) {
			return null;
		}
		return this.findOne<T, O>({ accessToken }, options);
	}

	async findOneByRefreshToken<
		T extends Document = IOAuthAccessToken,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(refreshToken: string, options?: O): Promise<DocumentWithProjection<T, O> | null> {
		if (typeof refreshToken !== 'string' || !refreshToken) {
			return null;
		}
		return this.findOne<T, O>({ refreshToken }, options);
	}

	async deleteByUserId(userId: string): Promise<DeleteResult> {
		return this.deleteMany({ userId });
	}

	async deleteByUserIds(userIds: string[]): Promise<DeleteResult> {
		return this.deleteMany({ userId: { $in: userIds } });
	}
}
