import type { ServerResponse, IncomingMessage } from 'node:http';
import { URL } from 'node:url';

import { WebApp } from 'meteor/webapp';

import { settings } from '../../../../../app/settings/server';

async function returnMatrixServerJSON(_: IncomingMessage, res: ServerResponse) {
	if (!settings.get<boolean>('Federation_Matrix_enabled') || !settings.get<boolean>('Federation_Matrix_serve_well_known')) {
		res.writeHead(404).end();
		return;
	}

	const homeserverUrl = settings.get<string>('Federation_Matrix_homeserver_url');
	const { hostname, port = '443' } = new URL(homeserverUrl); // a case where port isn't specified would be if it's 80 or 443, if 80, federation isn't going to work, so we simply assume 443.

	res.setHeader('content-type', 'application/json');

	res.write(JSON.stringify({ 'm.server': `${hostname}:${port || '443'}` }));

	res.end();
}

async function returnMatrixClientJSON(_: IncomingMessage, res: ServerResponse) {
	if (!settings.get<boolean>('Federation_Matrix_enabled') || !settings.get<boolean>('Federation_Matrix_serve_well_known')) {
		res.writeHead(404).end();
		return;
	}

	const homeserverUrl = settings.get<string>('Federation_Matrix_homeserver_url');
	const { protocol = 'https:', hostname } = new URL(homeserverUrl);

	res.setHeader('content-type', 'application/json');

	res.write(JSON.stringify({ 'm.homeserver': { base_url: `${protocol}//${hostname}` } }));

	res.end();
}

WebApp.connectHandlers.use('/.well-known/matrix/server', returnMatrixServerJSON);
WebApp.connectHandlers.use('/.well-known/matrix/client', returnMatrixClientJSON);
