import { httpApp } from '../lib/http/httpServer';

const syncUrl = `${(global as any)?.ROOT_URL_PATH_PREFIX || ''}/_timesync`;

httpApp.all(`${syncUrl}/*`, (c) =>
	c.text(Date.now().toString(), 200, {
		// Never ever cache this, otherwise weird times are shown on reload
		// http://stackoverflow.com/q/18811286/586086
		'Cache-Control': 'no-cache, no-store, must-revalidate',
		'Pragma': 'no-cache',
		'Expires': '0',
	}),
);
