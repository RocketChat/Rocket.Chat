import { api, getConnection, getTrashCollection } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import { registerServiceModels } from '@rocket.chat/models';
import { startBroker } from '@rocket.chat/network-broker';
import { startTracing } from '@rocket.chat/tracing';
import polka from 'polka';

const PORT = process.env.PORT || 3036;

(async () => {
	const { db, client } = await getConnection();

	startTracing({ service: 'omnichannel-transcript', db: client });

	registerServiceModels(db, await getTrashCollection());

	api.setBroker(startBroker());

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
