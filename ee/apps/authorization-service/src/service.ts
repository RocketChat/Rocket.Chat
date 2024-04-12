import { api } from '@rocket.chat/core-services';
import { db, trash } from '@rocket.chat/models';
import type { Document } from 'mongodb';
import polka from 'polka';

import { Collections, getCollection, getConnection } from '../../../../apps/meteor/ee/server/services/mongo';
import { broker } from '../../../../apps/meteor/ee/server/startup/broker';

const PORT = process.env.PORT || 3034;

(async () => {
	const mongoDatabase = await getConnection();

	const trashCollection = await getCollection<Document>(Collections.Trash);

	db.register(mongoDatabase);

	trash.register(trashCollection);

	api.setBroker(broker);

	// need to import service after models are registered
	const { Authorization } = await import('../../../../apps/meteor/server/services/authorization/service');

	api.registerService(new Authorization());

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
