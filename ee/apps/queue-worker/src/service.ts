import { api, getConnection, getTrashCollection } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import { broker } from '@rocket.chat/network-broker';
import { startTracing } from '@rocket.chat/tracing';
import polka from 'polka';

import { registerServiceModels } from '../../../../apps/meteor/ee/server/lib/registerServiceModels';

startTracing({ service: 'queue-worker' });

const PORT = process.env.PORT || 3038;

(async () => {
	const db = await getConnection();

	registerServiceModels(db, await getTrashCollection());

	api.setBroker(broker);

	// need to import service after models are registeredpackagfe
	const { QueueWorker } = await import('@rocket.chat/omnichannel-services');

	api.registerService(new QueueWorker(db, Logger));

	await api.start();

	polka()
		.get('/health', async function (_req, res) {
			try {
				await api.nodeList();
				res.end('ok');
			} catch (err) {
				console.error('Service not healthy', err);

				res.writeHead(500);
				res.end('not healthy');
			}
		})
		.listen(PORT);
})();
