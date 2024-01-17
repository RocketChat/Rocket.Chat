import { WebApp } from 'meteor/webapp';

import { isRunningMs } from '../lib/isRunningMs';
import { SystemLogger } from '../lib/logger/system';

WebApp.rawConnectHandlers.use('/health', async (_req, res) => {
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', 0);
	res.setHeader('Content-Type', 'text/plain');

	if (!isRunningMs()) {
		const { isLastDocDelayed } = await import('../startup/watchDb');

		if (isLastDocDelayed()) {
			SystemLogger.error('System not healthy due to no real time data received recently');
			res.writeHead(500);
			res.end('not healthy');
			return;
		}
	}

	res.end('ok');
});
