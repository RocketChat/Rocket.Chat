---
to: ee/apps/<%= name %>/src/service.ts
---
import type { Document } from 'mongodb';
import polka from 'polka';
import { api } from '@rocket.chat/core-services';
import { db, trash } from '@rocket.chat/models';

import { broker } from '../../../../apps/meteor/ee/server/startup/broker';
import { Collections, getCollection, getConnection } from '../../../../apps/meteor/ee/server/services/mongo';

const PORT = process.env.PORT || <%= h.random() %>;

(async () => {
	const mongoDatabase = await getConnection();

	const trashCollection = await getCollection<Document>(Collections.Trash);

	db.register(mongoDatabase);

	trash.register(trashCollection);

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
