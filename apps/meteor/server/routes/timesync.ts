import { nodeHandler } from '@rocket.chat/http-router';

import { nodeLoggerMiddleware } from '../api/v1/middlewares/logger';
import { httpApp } from '../lib/http/httpServer';
import { HttpLogger } from '../lib/logger/http';

const syncUrl = `${(global as any)?.ROOT_URL_PATH_PREFIX || ''}/_timesync`;

httpApp.all(`${syncUrl}/*`, nodeHandler(nodeLoggerMiddleware(HttpLogger)), (c) =>
	c.text(Date.now().toString(), 200, {
		// Never ever cache this, otherwise weird times are shown on reload
		// http://stackoverflow.com/q/18811286/586086
		'Cache-Control': 'no-cache, no-store, must-revalidate',
		'Pragma': 'no-cache',
		'Expires': '0',
	}),
);
