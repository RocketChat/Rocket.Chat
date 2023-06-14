import type { Document } from 'mongodb';
import polka from 'polka';
import { api } from '@rocket.chat/core-services';

import { broker } from '../../../../apps/meteor/ee/server/startup/broker';
import { Collections, getCollection, getConnection } from '../../../../apps/meteor/ee/server/services/mongo';
import { registerServiceModels } from '../../../../apps/meteor/ee/server/lib/registerServiceModels';

const PORT = process.env.PORT || 3034;

(async () => {
	const db = await getConnection();

	const trash = await getCollection<Document>(Collections.Trash);

	registerServiceModels(db, trash);

	api.setBroker(broker);

	// need to import service after models are registered
	const { AppsEngineService, AppsApiService, AppsConverterService, AppsManagerService, AppsStatisticsService, AppsVideoManagerService } =
		await import('../../../../apps/meteor/ee/server/apps/services');

	api.registerService(new AppsEngineService(db));
	api.registerService(new AppsStatisticsService());
	api.registerService(new AppsConverterService());
	api.registerService(new AppsManagerService());
	api.registerService(new AppsVideoManagerService());
	api.registerService(new AppsApiService());

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
