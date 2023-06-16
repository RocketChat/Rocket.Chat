import type { Document } from 'mongodb';
import polka from 'polka';
import { api } from '@rocket.chat/core-services';

import { broker } from '../../../../apps/meteor/ee/server/startup/broker';
import { Collections, getCollection, getConnection } from '../../../../apps/meteor/ee/server/services/mongo';
import { registerServiceModels } from '../../../../apps/meteor/ee/server/lib/registerServiceModels';
import { Logger } from '../../../../apps/meteor/server/lib/logger/Logger';
import { enterpriseAdapter } from '../../../../apps/meteor/ee/app/license/server/license';

const PORT = process.env.PORT || 3036;

(async () => {
	const db = await getConnection();

	const trash = await getCollection<Document>(Collections.Trash);

	registerServiceModels(db, trash);

	api.setEnterpriseAdapter(enterpriseAdapter);
	api.setBroker(broker);

	// need to import service after models are registered
	const { OmnichannelTranscript } = await import('@rocket.chat/omnichannel-services');

	api.registerService(new OmnichannelTranscript(Logger), ['queue-worker']);

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
