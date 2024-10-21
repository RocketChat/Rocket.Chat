---
to: ee/apps/<%= name %>/src/service.ts
---
import { api, getConnection, getTrashCollection } from '@rocket.chat/core-services';
import { broker } from '@rocket.chat/network-broker';
import polka from 'polka';

import { registerServiceModels } from '../../../../apps/meteor/ee/server/lib/registerServiceModels';

const PORT = process.env.PORT || <%= h.random() %>;

(async () => {
	const db = await getConnection();

	registerServiceModels(db, await getTrashCollection());

	api.setBroker(broker);

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
