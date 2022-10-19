import { MongoInternals } from 'meteor/mongo';

import { DatabaseWatcher } from '../database/DatabaseWatcher';
import { db } from '../database/utils';
import { initWatchers } from '../modules/watchers/watchers.module';
import { api } from '../sdk/api';
import { metrics } from '../../app/metrics/server/lib/metrics';
import { SystemLogger } from '../lib/logger/system';

const { mongo } = MongoInternals.defaultRemoteCollectionDriver();

const instancePing = parseInt(String(process.env.MULTIPLE_INSTANCES_PING_INTERVAL)) || 10000;

const maxDocMs = instancePing * 4; // 4 times the ping interval

const watcher = new DatabaseWatcher({ db, _oplogHandle: (mongo as any)._oplogHandle, metrics });

initWatchers(watcher, api.broadcastLocal.bind(api));

watcher.watch();

setInterval(function _checkDatabaseWatcher() {
	if (isLastDocDelayed()) {
		SystemLogger.error('No real time data received recently');
	}
}, 20000);

export function isLastDocDelayed(): boolean {
	const lastDocMs = watcher.getLastDocDelta();

	return lastDocMs > maxDocMs;
}
