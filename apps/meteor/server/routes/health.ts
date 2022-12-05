import { WebApp } from 'meteor/webapp';

import { isRunningMs } from '../lib/isRunningMs';

WebApp.rawConnectHandlers.use('/health', async function (_req, res) {
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', 0);
	res.setHeader('Content-Type', 'text/plain');

	if (!isRunningMs()) {
		const { isLastDocDelayed } = await import('../startup/watchDb');

		if (isLastDocDelayed()) {
			res.writeHead(500);
			res.end('not healthy');
			return;
		}
	}

	res.end('ok');
});
