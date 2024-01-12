import { api } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import type { Document } from 'mongodb';
import polka from 'polka';

import { registerServiceModels } from '../../../../apps/meteor/ee/server/lib/registerServiceModels';
import { Collections, getCollection, getConnection } from '../../../../apps/meteor/ee/server/services/mongo';
import { broker } from '../../../../apps/meteor/ee/server/startup/broker';
import { DatabaseWatcher } from '../../../../apps/meteor/server/database/DatabaseWatcher';
import { StreamHub } from './StreamHub';

const PORT = process.env.PORT || 3035;

(async () => {
	const db = await getConnection();

	const trash = await getCollection<Document>(Collections.Trash);

	registerServiceModels(db, trash);

	api.setBroker(broker);

	// TODO having to import Logger to pass as a param is a temporary solution. logger should come from the service (either from broker or api)
	const watcher = new DatabaseWatcher({ db, logger: Logger });

	api.registerService(new StreamHub(watcher, Logger));

	await api.start();

	polka()
		.get('/health', async function (_req, res) {
			try {
				await api.nodeList();

				if (watcher.isLastDocDelayed()) {
					throw new Error('No real time data received recently');
				}
			} catch (err) {
				console.error('Service not healthy', err);

				res.writeHead(500);
				res.end('not healthy');
				return;
			}

			res.end('ok');
		})
		.listen(PORT);
})();
