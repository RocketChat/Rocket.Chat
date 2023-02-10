import type { Document } from 'mongodb';
import polka from 'polka';

import { api } from '../../../../apps/meteor/server/sdk/api';
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
	const { AppsOrchestratorService } = await import('../../../../apps/meteor/ee/app/apps/service');
	const { AppsStatisticsService } = await import('../../../../apps/meteor/ee/app/apps/statisticsService');
	const { AppsConverterService } = await import('../../../../apps/meteor/ee/app/apps/converterService');
	const { AppsManagerService } = await import('../../../../apps/meteor/ee/app/apps/managerService');
	const { AppsVideoManagerService } = await import('../../../../apps/meteor/ee/app/apps/videoManagerService');

	api.registerService(new AppsOrchestratorService(db));
	api.registerService(new AppsStatisticsService());
	api.registerService(new AppsConverterService());
	api.registerService(new AppsManagerService());
	api.registerService(new AppsVideoManagerService());

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
