import type { ServerResponse } from 'http';

import type { IncomingMessage } from 'connect';
import { WebApp } from 'meteor/webapp';
import { match } from 'path-to-regexp';

const matchRoute = match<{ lng: string }>('/:lng.json', { decode: decodeURIComponent });

const i18nHandler = async function (req: IncomingMessage, res: ServerResponse) {
	const url = new URL(req.url ?? '/', `https://${req.headers.host}`);
	const match = matchRoute(url.pathname);

	if (match === false) {
		res.writeHead(400);
		res.end();
		return;
	}

	const { lng } = match.params;

	try {
		const data = await Assets.getText(`i18n/${lng}.i18n.json`);
		if (!data) {
			throw new Error();
		}

		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Length', data.length);
		res.writeHead(200);
		res.end(data);
	} catch (e) {
		res.writeHead(400);
		res.end();
	}
};

WebApp.connectHandlers.use('/i18n/', i18nHandler);
