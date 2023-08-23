import type { IAppsTokens } from '@rocket.chat/core-typings';
import type { IAppsTokensModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AppsTokens extends BaseRaw<IAppsTokens> implements IAppsTokensModel {
	constructor(db: Db) {
		super(db, '_raix_push_app_tokens', undefined, { collectionNameResolver: (name) => name });
	}
}
