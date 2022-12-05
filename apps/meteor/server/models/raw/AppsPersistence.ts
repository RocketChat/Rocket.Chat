import type { IPersistenceItem as IAppsPersistenceItem } from '@rocket.chat/apps-engine/definition/persistence';
import type { IAppsPersistenceModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AppsPersistenceRaw extends BaseRaw<IAppsPersistenceItem> implements IAppsPersistenceModel {
	constructor(db: Db) {
		super(db, 'apps_persistence');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { appId: 1 } }, { key: { associations: 1 } }];
	}
}
