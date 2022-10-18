import type { Document } from 'mongodb';
import polka from 'polka';

import { api } from '../../../../apps/meteor/server/sdk/api';
import { broker } from '../../../../apps/meteor/ee/server/startup/broker';
import { Collections, getCollection, getConnection } from '../../../../apps/meteor/ee/server/services/mongo';
import { registerServiceModels } from '../../../../apps/meteor/ee/server/lib/registerServiceModels';

const PORT = process.env.PORT || 3035;

const instancePing = parseInt(String(process.env.MULTIPLE_INSTANCES_PING_INTERVAL)) || 10000;

const maxDocMs = instancePing * 4; // 4 times the ping interval

(async () => {
	const db = await getConnection();

	const trash = await getCollection<Document>(Collections.Trash);

	registerServiceModels(db, trash);

	api.setBroker(broker);

	// need to import service after models are registered
	const { StreamHub } = await import('./StreamHub');
	const { DatabaseWatcher } = await import('../../../../apps/meteor/server/database/DatabaseWatcher');

	const watcher = new DatabaseWatcher({ db });

	api.registerService(new StreamHub(watcher));

	await api.start();

	polka()
		.get('/health', async function (_req, res) {
			try {
				await api.nodeList();

				const lastDocMs = watcher.getLastDocDelta();
				if (lastDocMs > maxDocMs) {
					throw new Error('not healthy');
				}
			} catch (e) {
				res.writeHead(500);
				res.end('not healthy');
				return;
			}

			res.end('ok');
		})
		.listen(PORT);
})();
