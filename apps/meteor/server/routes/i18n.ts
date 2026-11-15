import type { ServerResponse } from 'node:http';

import type { IncomingMessage } from 'connect';
import { WebApp } from 'meteor/webapp';
import { match } from 'path-to-regexp';

import { getLanguageResourceJSON } from '../lib/i18n';

const matchRoute = match<{ lng: string }>('/:lng.json', { decode: decodeURIComponent });

const i18nHandler = function (req: IncomingMessage, res: ServerResponse) {
	const url = new URL(req.url ?? '/', `https://${req.headers.host}`);
	const match = matchRoute(url.pathname);

	if (match === false) {
		res.writeHead(400);
		res.end();
		return;
	}

	const data = getLanguageResourceJSON(match.params.lng);
	if (!data) {
		res.writeHead(400);
		res.end();
		return;
	}

	res.setHeader('Content-Type', 'application/json');
	res.setHeader('Content-Length', Buffer.byteLength(data));
	res.writeHead(200);
	res.end(data);
};

WebApp.connectHandlers.use('/i18n/', i18nHandler);
