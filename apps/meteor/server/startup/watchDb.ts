import { MongoInternals } from 'meteor/mongo';

import { DatabaseWatcher } from '../database/DatabaseWatcher';
import { db } from '../database/utils';
import { initWatchers } from '../modules/watchers/watchers.module';
import { api } from '../sdk/api';
import { metrics } from '../../app/metrics/server/lib/metrics';
import { SystemLogger } from '../lib/logger/system';
import { Logger } from '../lib/logger/Logger';

const { mongo } = MongoInternals.defaultRemoteCollectionDriver();

const watcher = new DatabaseWatcher({ db, _oplogHandle: (mongo as any)._oplogHandle, metrics, logger: Logger });

initWatchers(watcher, api.broadcastLocal.bind(api));

watcher.watch().catch((err: Error) => {
	SystemLogger.fatal(err, 'Fatal error occurred when watching database');
	process.exit(1);
});

setInterval(function _checkDatabaseWatcher() {
	if (watcher.isLastDocDelayed()) {
		SystemLogger.error('No real time data received recently');
	}
}, 20000);

export function isLastDocDelayed(): boolean {
	return watcher.isLastDocDelayed();
}
