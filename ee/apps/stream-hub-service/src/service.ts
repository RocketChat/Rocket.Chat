import { api, getConnection, getTrashCollection } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import { DatabaseWatcher, registerServiceModels } from '@rocket.chat/models';
import { startBroker } from '@rocket.chat/network-broker';
import { startTracing } from '@rocket.chat/tracing';
import polka from 'polka';

import { StreamHub } from './StreamHub';

const PORT = process.env.PORT || 3035;

(async () => {
	const { db, client } = await getConnection();

	startTracing({ service: 'stream-hub-service', db: client });

	registerServiceModels(db, await getTrashCollection());

	api.setBroker(startBroker());

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
