import type { IOAuthRefreshToken, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IOAuthRefreshTokensModel } from '@rocket.chat/model-typings';
import type { Db, Collection, DeleteResult, FindOptions, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class OAuthRefreshTokensRaw extends BaseRaw<IOAuthRefreshToken> implements IOAuthRefreshTokensModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IOAuthRefreshToken>>) {
		super(db, 'oauth_refresh_tokens', trash);
	}

	override modelIndexes(): IndexDescription[] {
		return [{ key: { refreshToken: 1 } }, { key: { userId: 1 } }, { key: { expires: 1 }, expireAfterSeconds: 60 * 60 * 24 * 30 }];
	}

	findOneByRefreshToken(refreshToken: string, options?: FindOptions<IOAuthRefreshToken>): Promise<IOAuthRefreshToken | null> {
		if (typeof refreshToken !== 'string' || !refreshToken) {
			return Promise.resolve(null);
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
