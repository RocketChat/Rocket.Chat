import type { IPushToken } from '@rocket.chat/core-typings';
import type { IPushTokenModel } from '@rocket.chat/model-typings';
import type { Db, DeleteWriteOpResultObject, IndexSpecification } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class PushTokenRaw extends BaseRaw<IPushToken> implements IPushTokenModel {
	constructor(db: Db) {
		super(db, '_raix_push_app_tokens');
	}

	modelIndexes(): IndexSpecification[] {
		return [{ key: { userId: 1, authToken: 1 } }, { key: { appName: 1, token: 1 } }];
	}

	removeByUserIdExceptTokens(userId: string, tokens: string[]): Promise<DeleteWriteOpResultObject> {
		return this.deleteMany({
			userId,
			authToken: { $nin: tokens },
		});
	}
}
