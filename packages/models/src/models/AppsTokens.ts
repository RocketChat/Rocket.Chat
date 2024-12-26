import type { IAppsTokens, IUser } from '@rocket.chat/core-typings';
import type { IAppsTokensModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AppsTokensRaw extends BaseRaw<IAppsTokens> implements IAppsTokensModel {
	constructor(db: Db) {
		super(db, '_raix_push_app_tokens', undefined, { collectionNameResolver: (name) => name });
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
}
