import { WebApp } from 'meteor/webapp';

import { isLastDocDelayed } from '../startup/watchDb';

WebApp.rawConnectHandlers.use('/health', function (_req, res) {
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', 0);
	res.setHeader('Content-Type', 'text/plain');

	if (isLastDocDelayed()) {
		res.writeHead(500);
		res.end('not healthy');
		return;
	}

	res.end('ok');
});
