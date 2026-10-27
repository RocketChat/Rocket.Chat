import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';

import { Session } from '@rocket.chat/ddp-server';
import { WebSocketServer } from 'ws';

import { ddpServer } from './ddpServer';
import { lifecycle } from './sessions';

type DdpTransport = 'raw' | 'sockjs';

/**
 * How a DDP client connecting at `pathname` frames its messages, or `undefined` when the path is no DDP endpoint.
 */
export const getDdpTransport = (pathname: string, pathPrefix: string): DdpTransport | undefined => {
	if (!pathname.startsWith(`${pathPrefix}/`)) {
		return undefined;
	}
	const path = pathname.slice(pathPrefix.length).replace(/\/$/, '');

	if (path === '/websocket' || path === '/sockjs/websocket') {
		return 'raw';
	}
	if (/^\/sockjs\/[^/.]+\/[^/.]+\/websocket$/.test(path)) {
		return 'sockjs';
	}
	return undefined;
};

const wss = new WebSocketServer({ noServer: true });

/**
 * Takes over an upgrade aimed at a DDP endpoint and serves it as a DDP session. Returns `false`, leaving the socket
 * untouched, for any other path.
 */
export const handleDdpUpgrade = (req: IncomingMessage, socket: Duplex, head: Buffer): boolean => {
	// `new URL` throws on request targets such as `//a:b@/`, and nothing catches a throw from the upgrade listener
	const [pathname] = (req.url ?? '/').split('?', 1);
	const transport = getDdpTransport(pathname, __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '');
	if (!transport) {
		return false;
	}

	wss.handleUpgrade(req, socket, head, (ws) => {
		new Session(ddpServer, lifecycle, ws, transport === 'sockjs', req);
	});
	return true;
};
