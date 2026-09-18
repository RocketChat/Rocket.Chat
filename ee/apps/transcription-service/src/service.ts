import { api, getConnection, getTrashCollection } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import { registerServiceModels } from '@rocket.chat/models';
import { startBroker } from '@rocket.chat/network-broker';
import { startTracing } from '@rocket.chat/tracing';
import { TranscriptionService } from '@rocket.chat/transcription-service';
import polka from 'polka';

const PORT = process.env.PORT || 3040;

void (async () => {
	const { db, client } = await getConnection();

	startTracing({ service: 'transcription', db: client });

	registerServiceModels(db, await getTrashCollection());

	api.setBroker(startBroker());

	api.registerService(new TranscriptionService(Logger));

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
