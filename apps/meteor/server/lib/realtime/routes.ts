import crypto from 'node:crypto';

import { handleDdpUpgrade } from './websocket';
import { addUpgradeHandler, httpApp } from '../http/httpServer';

addUpgradeHandler(handleDdpUpgrade);

const sockJsPath = `${__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || ''}/sockjs`;

// SockJS clients ask for the server's transports first. Only the websocket one is served, as ddp-streamer does.
httpApp.use(async (c, next) => {
	if (!c.req.path.startsWith(`${sockJsPath}/`)) {
		return next();
	}

	if (c.req.path !== `${sockJsPath}/info`) {
		return c.body(null, 404);
	}

	return c.json({ websocket: true, origins: ['*:*'], cookie_needed: false, entropy: crypto.randomBytes(4).readUInt32LE(0) }, 200, {
		'Access-Control-Allow-Origin': '*',
		'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
	});
});
