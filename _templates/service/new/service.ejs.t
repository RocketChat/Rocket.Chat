---
to: ee/apps/<%= name %>/src/service.ts
---
import { api, getConnection, getTrashCollection } from '@rocket.chat/core-services';
import { registerServiceModels } from '@rocket.chat/models';
import { startBroker } from '@rocket.chat/network-broker';
import { startTracing } from '@rocket.chat/tracing';
import polka from 'polka';

const PORT = process.env.PORT || <%= h.random() %>;

(async () => {
	const { db } = await getConnection();

	startTracing({ service: '<%= name %>', db: client });

	registerServiceModels(db, await getTrashCollection());

	api.setBroker(startBroker());

	// need to import service after models are registered
	const { <%= h.changeCase.pascalCase(name) %> } = await import('./<%= h.changeCase.pascalCase(name) %>');

	api.registerService(new <%= h.changeCase.pascalCase(name) %>());

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
