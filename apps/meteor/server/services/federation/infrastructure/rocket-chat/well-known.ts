import type { ServerResponse, IncomingMessage } from 'node:http';
import { URL } from 'node:url';

import type { ServerStackItem } from 'connect';
import { WebApp } from 'meteor/webapp';

import { settings } from '../../../../../app/settings/server';

const paths = {
	server: '/.well-known/matrix/server',
	client: '/.well-known/matrix/client',
} as const;

async function returnMatrixServerJSON(_: IncomingMessage, res: ServerResponse) {
	const homeserverUrl = settings.get<string>('Federation_Matrix_homeserver_url');
	const { hostname, port = '443' } = new URL(homeserverUrl); // a case where port isn't specified would be if it's 80 or 443, if 80, federation isn't going to work, so we simply assume 443.
	res.write(JSON.stringify({ 'm.server': `${hostname}:${port || '443'}` }));
	res.end();
}

async function returnMatrixClientJSON(_: IncomingMessage, res: ServerResponse) {
	const homeserverUrl = settings.get<string>('Federation_Matrix_homeserver_url');
	const { protocol = 'https:', hostname } = new URL(homeserverUrl);
	res.write(JSON.stringify({ 'm.homeserver': `${protocol}//${hostname}` }));
	res.end();
}

let _pathSet = false;

export function setupWellKnownPaths() {
	if (_pathSet) {
		return;
	}

	WebApp.connectHandlers.use(paths.server, returnMatrixServerJSON);
	WebApp.connectHandlers.use(paths.client, returnMatrixClientJSON);

	_pathSet = true;
}

export function teardownWellKnownPaths(): void {
	if (!_pathSet) {
		return;
	}

	const newStack: ServerStackItem[] = [];

	for (const item of WebApp.connectHandlers.stack) {
		switch (item.route) {
			case paths.server:
			case paths.client:
				continue;
		}

		newStack.push(item);
	}

	WebApp.connectHandlers.stack = newStack;

	_pathSet = false;
}
