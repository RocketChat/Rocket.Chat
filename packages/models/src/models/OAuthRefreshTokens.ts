import type { IOAuthRefreshToken, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IOAuthRefreshTokensModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Db, Collection, DeleteResult, IndexDescription, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class OAuthRefreshTokensRaw extends BaseRaw<IOAuthRefreshToken> implements IOAuthRefreshTokensModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IOAuthRefreshToken>>) {
		super(db, 'oauth_refresh_tokens', trash);
	}

	override modelIndexes(): IndexDescription[] {
		return [{ key: { refreshToken: 1 } }, { key: { userId: 1 } }, { key: { expires: 1 }, expireAfterSeconds: 60 * 60 * 24 * 30 }];
	}

	findOneByRefreshToken<T extends Document = IOAuthRefreshToken, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		refreshToken: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		if (typeof refreshToken !== 'string' || !refreshToken) {
			return Promise.resolve(null);
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
