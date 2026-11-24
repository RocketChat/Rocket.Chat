import crypto from 'node:crypto';

import { handleDdpUpgrade } from './websocket';
import { addUpgradeHandler, httpApp } from '../http/httpServer';

addUpgradeHandler(handleDdpUpgrade);

const pathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
const sockJsPath = `${pathPrefix}/sockjs`;

// the websocket endpoint asked for without an upgrade gets SockJS's answer
for (const path of [`${pathPrefix}/websocket`, `${pathPrefix}/websocket/`]) {
	httpApp.all(path, (c) => c.text('Can "Upgrade" only to "WebSocket".', 400));
}

// SockJS clients ask for the server's transports first; only the websocket one is served.
httpApp.all(`${sockJsPath}/info`, (c) =>
	c.json({ websocket: true, origins: ['*:*'], cookie_needed: false, entropy: crypto.randomBytes(4).readUInt32LE(0) }, 200, {
		'Access-Control-Allow-Origin': '*',
		'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
	}),
);

httpApp.all(`${sockJsPath}/*`, (c) => c.body(null, 404));
