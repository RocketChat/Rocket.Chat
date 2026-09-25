import { api, getConnection, getTrashCollection } from '@rocket.chat/core-services';
import { logLevel } from '@rocket.chat/logger';
import type { LogLevelSetting } from '@rocket.chat/logger';
import { registerServiceModels } from '@rocket.chat/models';
import { startBroker } from '@rocket.chat/network-broker';
import { startTracing } from '@rocket.chat/tracing';
import polka from 'polka';

const PORT = process.env.PORT || 3039;

const DECODE_ONLY = process.env.XMPP_DECODE_ONLY === 'true';

const LOG_LEVEL_SETTINGS: Record<string, LogLevelSetting> = { warn: '0', info: '1', debug: '2' };

// Loggers otherwise follow the Log_Level setting, which only ever reaches Meteor's own process
const logLevelSetting = LOG_LEVEL_SETTINGS[process.env.LOG_LEVEL ?? ''];
if (logLevelSetting) {
	logLevel.emit('changed', logLevelSetting);
}

void (async () => {
	const { db, client } = await getConnection();

	startTracing({ service: 'xmpp-server-service', db: client });

	registerServiceModels(db, await getTrashCollection());

	api.setBroker(startBroker());

	// need to import service after models are registered
	const { XMPPServerService } = await import('@rocket.chat/xmpp-server');

	const xmppServer = new XMPPServerService({ forwardToRocketChat: !DECODE_ONLY });

	api.registerService(xmppServer);

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
		.get('/stats', function (_req, res) {
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(xmppServer.getInboundEventCounts()));
		})
		.listen(PORT);
})();
