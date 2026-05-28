import { api, getConnection, getTrashCollection } from '@rocket.chat/core-services';
import { registerServiceModels } from '@rocket.chat/models';
import { startBroker } from '@rocket.chat/network-broker';
import { startTracing } from '@rocket.chat/tracing';
import polka from 'polka';

const PORT = process.env.PORT || 3038;

void (async () => {
	const { db, client } = await getConnection();

	startTracing({ service: 'ai-search-service', db: client });

	registerServiceModels(db, await getTrashCollection());

	api.setBroker(startBroker());

	// Need to import the service after models are registered.
	const { AISearchService } = await import('../../../../apps/meteor/server/services/ai-search/service');

	api.registerService(new AISearchService());

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
