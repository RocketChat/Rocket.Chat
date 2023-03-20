import type { IAppStorageItem } from '@rocket.chat/core-typings';
import type { IAppsModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AppsRaw extends BaseRaw<IAppStorageItem> implements IAppsModel {
	constructor(db: Db) {
		super(db, 'apps');
	}
}
