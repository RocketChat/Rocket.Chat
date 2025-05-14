import { WebApp } from 'meteor/webapp';

WebApp.rawConnectHandlers.use('/health', async (_req, res) => {
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', 0);
	res.setHeader('Content-Type', 'text/plain');

	res.end('ok');
});
