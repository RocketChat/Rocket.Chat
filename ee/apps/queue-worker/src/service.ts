import { api } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import type { Document } from 'mongodb';
import polka from 'polka';

import { registerServiceModels } from '../../../../apps/meteor/ee/server/lib/registerServiceModels';
import { Collections, getCollection, getConnection } from '../../../../apps/meteor/ee/server/services/mongo';
import { broker } from '../../../../apps/meteor/ee/server/startup/broker';

const PORT = process.env.PORT || 3038;

(async () => {
	const db = await getConnection();

	const trash = await getCollection<Document>(Collections.Trash);

	registerServiceModels(db, trash);

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
