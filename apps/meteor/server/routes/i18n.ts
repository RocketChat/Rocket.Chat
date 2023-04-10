import type { ServerResponse } from 'http';

import { match } from 'path-to-regexp';
import type { IncomingMessage } from 'connect';
import { WebApp } from 'meteor/webapp';

const matchRoute = match<{ lng: string }>('/:lng.json', { decode: decodeURIComponent });

const i18nHandler = async function (req: IncomingMessage, res: ServerResponse) {
	const match = matchRoute(req.url ?? '/');

	if (match === false) {
		res.writeHead(400);
		res.end();
		return;
	}

	const { lng } = match.params;

	Assets.getText(`i18n/${lng}.i18n.json`, (err: Error, data: Record<string, any>) => {
		if (err || !data) {
			res.writeHead(400);
			res.end();
			return;
		}

		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Length', data.length);
		res.writeHead(200);
		res.end(data);
	});
};

WebApp.connectHandlers.use('/i18n/', i18nHandler);
