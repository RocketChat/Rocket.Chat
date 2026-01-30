import { AbacService } from '@rocket.chat/abac';
import { api, getConnection, getTrashCollection } from '@rocket.chat/core-services';
import { registerServiceModels } from '@rocket.chat/models';
import { startBroker } from '@rocket.chat/network-broker';
import { startTracing } from '@rocket.chat/tracing';
import polka from 'polka';

const PORT = process.env.PORT || 3034;

(async () => {
	const { db, client } = await getConnection();

	startTracing({ service: 'authorization-service', db: client });

	registerServiceModels(db, await getTrashCollection());

	api.setBroker(startBroker());

	// need to import service after models are registered
	const { Authorization } = await import('../../../../apps/meteor/server/services/authorization/service');

	api.registerService(new Authorization());

	if (!process.env.USE_EXTERNAL_ABAC_SERVICE) {
		// Same API as authz service but own core-services proxy
		api.registerService(new AbacService());
	}

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
