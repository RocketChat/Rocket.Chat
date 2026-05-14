import type { IOAuthAuthCode, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IOAuthAuthCodesModel } from '@rocket.chat/model-typings';
import type { Db, Collection, DeleteResult, FindOptions, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class OAuthAuthCodesRaw extends BaseRaw<IOAuthAuthCode> implements IOAuthAuthCodesModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IOAuthAuthCode>>) {
		super(db, 'oauth_auth_codes', trash);
	}

	override modelIndexes(): IndexDescription[] {
		return [{ key: { authCode: 1 } }, { key: { userId: 1 } }, { key: { expires: 1 }, expireAfterSeconds: 60 * 5 }];
	}

	findOneByAuthCode(authCode: string, options?: FindOptions<IOAuthAuthCode>): Promise<IOAuthAuthCode | null> {
		if (typeof authCode !== 'string' || !authCode) {
			return Promise.resolve(null);
		}
		return this.findOne({ authCode }, options);
	}

	async deleteByUserId(userId: string): Promise<DeleteResult> {
		return this.deleteMany({ userId });
	}

	async deleteByUserIds(userIds: string[]): Promise<DeleteResult> {
		return this.deleteMany({ userId: { $in: userIds } });
	}
}
