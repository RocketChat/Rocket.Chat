import type { IAppsTokens, IUser } from '@rocket.chat/core-typings';
import type { IAppsTokensModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AppsTokens extends BaseRaw<IAppsTokens> implements IAppsTokensModel {
	constructor(db: Db) {
		super(db, '_raix_push_app_tokens', undefined, { collectionNameResolver: (name) => name });
	}

	countTokensByClientType(apn: boolean, gcm: boolean, userId?: IUser['_id']) {
		const apnQuery = apn && {
			'token.apn': {
				$exists: true,
			},
		};
		const gcmQuery = gcm && {
			'token.gcm': {
				$exists: true,
			},
		};

		const query = {
			$and: [
				{
					userId,
				},
				{
					...((apn || gcm) && { $or: [apnQuery, gcmQuery] }),
				},
			],
		};

		return this.countDocuments(query);
	}
}
