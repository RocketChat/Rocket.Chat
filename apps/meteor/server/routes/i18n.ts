import { ServerResponse } from 'http';

import { match } from 'path-to-regexp';
import { IncomingMessage } from 'connect';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

const matchRoute = match<{ lng: string }>('/:lng.json', { decode: decodeURIComponent });

const i18nHandler = Meteor.bindEnvironment(async function (req: IncomingMessage, res: ServerResponse) {
	const match = matchRoute(req.url ?? '/');

	if (match === false) {
		res.writeHead(400);
		res.end();
		return;
	}

	const { lng } = match.params;

	const resourceJson = Assets.getText(`i18n/${lng}.i18n.json`);

	if (!resourceJson) {
		res.writeHead(400);
		res.end();
		return;
	}

	res.setHeader('Content-Type', 'application/json');
	res.setHeader('Content-Length', resourceJson.length);
	res.writeHead(200);
	res.end(resourceJson);
});

WebApp.connectHandlers.use('/i18n/', i18nHandler);
