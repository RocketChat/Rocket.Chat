import type { Document } from 'mongodb';
import polka from 'polka';
import { api } from '@rocket.chat/core-services';

import { broker } from '../../../../apps/meteor/ee/server/startup/broker';
import { enterpriseAdapter } from '../../../../apps/meteor/ee/app/license/server/license';
import { Collections, getCollection, getConnection } from '../../../../apps/meteor/ee/server/services/mongo';
import { registerServiceModels } from '../../../../apps/meteor/ee/server/lib/registerServiceModels';
import { Logger } from '../../../../apps/meteor/server/lib/logger/Logger';

const PORT = process.env.PORT || 3035;

(async () => {
	const db = await getConnection();

	const trash = await getCollection<Document>(Collections.Trash);

	registerServiceModels(db, trash);

	api.setEnterpriseAdapter(enterpriseAdapter);
	api.setBroker(broker);

	// need to import service after models are registered
	const { StreamHub } = await import('./StreamHub');
	const { DatabaseWatcher } = await import('../../../../apps/meteor/server/database/DatabaseWatcher');

	// TODO having to import Logger to pass as a param is a temporary solution. logger should come from the service (either from broker or api)
	const watcher = new DatabaseWatcher({ db, logger: Logger });

	api.registerService(new StreamHub(watcher, Logger));

	await api.start();

	polka()
		.get('/health', async function (_req, res) {
			try {
				await api.nodeList();

				if (watcher.isLastDocDelayed()) {
					throw new Error('not healthy');
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
