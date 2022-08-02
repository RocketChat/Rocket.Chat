import { MongoInternals } from 'meteor/mongo';

import { DatabaseWatcher } from '../database/DatabaseWatcher';
import { db } from '../database/utils';
import { isRunningMs } from '../lib/isRunningMs';
import { initWatchers } from '../modules/watchers/watchers.module';
import { api } from '../sdk/api';
import { metrics } from '../../app/metrics/server/lib/metrics';

if (!isRunningMs()) {
	const { mongo } = MongoInternals.defaultRemoteCollectionDriver();

	const watcher = new DatabaseWatcher({ db, _oplogHandle: (mongo as any)._oplogHandle, metrics });

	initWatchers(watcher, api.broadcastLocal.bind(api));

	watcher.watch();
}
