import type { IOAuthAccessToken, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IOAuthAccessTokensModel } from '@rocket.chat/model-typings';
import type { Db, Collection, DeleteResult, FindOptions, IndexDescription } from 'mongodb';

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

	async findOneByAccessToken(accessToken: string, options?: FindOptions<IOAuthAccessToken>): Promise<IOAuthAccessToken | null> {
		if (typeof accessToken !== 'string' || !accessToken) {
			return null;
		}
		return this.findOne({ accessToken }, options);
	}

	async findOneByRefreshToken(refreshToken: string, options?: FindOptions<IOAuthAccessToken>): Promise<IOAuthAccessToken | null> {
		if (typeof refreshToken !== 'string' || !refreshToken) {
			return null;
		}
		return this.findOne({ refreshToken }, options);
	}

	async deleteByUserId(userId: string): Promise<DeleteResult> {
		return this.deleteMany({ userId });
	}

	async deleteByUserIds(userIds: string[]): Promise<DeleteResult> {
		return this.deleteMany({ userId: { $in: userIds } });
	}
}
