import { api, getConnection, getTrashCollection } from '@rocket.chat/core-services';
import { logLevel } from '@rocket.chat/logger';
import type { LogLevelSetting } from '@rocket.chat/logger';
import { registerServiceModels } from '@rocket.chat/models';
import { startBroker } from '@rocket.chat/network-broker';
import { startTracing } from '@rocket.chat/tracing';
import polka from 'polka';

import { parseDnsOverrides } from './dnsOverrides';
import { createInboundMetrics } from './metrics';

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
	const { XMPPServerService, resolveXmppServer } = await import('@rocket.chat/xmpp-server');

	const metrics = createInboundMetrics({ decodeOnly: DECODE_ONLY });

	const xmppServer = new XMPPServerService({
		forwardToRocketChat: !DECODE_ONLY,
		observeHandler: metrics.observeHandler,
		resolver: parseDnsOverrides(process.env.XMPP_DNS_OVERRIDES, resolveXmppServer),
	});
	metrics.setDecodedSource(() => xmppServer.getInboundEventCounts());

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
		.get('/stats', async function (_req, res) {
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(await metrics.stats()));
		})
		.get('/metrics', async function (_req, res) {
			res.setHeader('Content-Type', metrics.registry.contentType);
			res.end(await metrics.registry.metrics());
		})
		.listen(PORT);
})();
