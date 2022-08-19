import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import type { RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IAppsModel } from '@rocket.chat/model-typings';
import type { Db, Collection } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AppsRaw extends BaseRaw<IAppStorageItem> implements IAppsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IAppStorageItem>>) {
		super(db, 'apps', trash);
	}
}
